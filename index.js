const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')
const fs = require('fs')

// 🔥 BORRAR SESIÓN SI EXISTE (ARREGLA 401)
if (fs.existsSync('./session')) {
    fs.rmSync('./session', { recursive: true, force: true })
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '1.0.0'],
        version,
        auth: state,
        markOnlineOnConnect: true,
        printQRInTerminal: true
    })

    // 🔗 CONEXIÓN
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('\n📱 ESCANEA ESTE QR:\n')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            console.log('✅ BOT CONECTADO 🔥')
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('❌ Conexión cerrada:', reason)

            if (reason !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconectando...')
                startBot()
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔥 LECTOR DE MENSAJES (CLAVE)
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            if (type !== 'notify') return

            const msg = messages[0]
            if (!msg.message) return
            if (msg.key.fromMe) return

            const from = msg.key.remoteJid

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                ""

            if (!text) return

            console.log("📩 Mensaje:", text)

            if (!text.startsWith("!")) return

            const command = text.slice(1).toLowerCase()

            if (command === "ping") {
                await sock.sendMessage(from, { text: "🏓 Pong desde Railway 🔥" })
            }

            if (command === "menu") {
                await sock.sendMessage(from, {
                    text: "📜 Menu:\n!ping\n!menu\n!info"
                })
            }

            if (command === "info") {
                await sock.sendMessage(from, {
                    text: "🤖 Bot funcionando en Railway 🚀"
                })
            }

        } catch (err) {
            console.log("❌ Error:", err)
        }
    })
}

startBot()
