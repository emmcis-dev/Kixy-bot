const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

// 🔥 LIMPIAR SESIÓN SI SE ROMPE
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
        markOnlineOnConnect: true
    })

    let codigoGenerado = false

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'connecting') {
            console.log('🔄 Conectando...')
        }

        // 🔥 GENERAR CÓDIGO CORRECTAMENTE
        if (!codigoGenerado) {
            const phoneNumber = "50238829642" // 👈 CAMBIA POR TU NÚMERO

            try {
                const code = await sock.requestPairingCode(phoneNumber)
                console.log(`\n📱 CÓDIGO DE VINCULACIÓN:\n👉 ${code}\n`)
                codigoGenerado = true
            } catch (e) {
                console.log("❌ Error generando código:", e.message)
            }
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

    // 🔥 LECTOR DE MENSAJES (YA FUNCIONA)
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

            const cmd = text.slice(1).toLowerCase()

            if (cmd === "ping") {
                await sock.sendMessage(from, { text: "🏓 Pong funcionando 🔥" })
            }

            if (cmd === "menu") {
                await sock.sendMessage(from, {
                    text: "📜 Menu:\n!ping\n!menu\n!info"
                })
            }

            if (cmd === "info") {
                await sock.sendMessage(from, {
                    text: "🤖 Bot activo en Railway 🚀"
                })
            }

        } catch (err) {
            console.log("❌ Error:", err)
        }
    })
}

startBot()
