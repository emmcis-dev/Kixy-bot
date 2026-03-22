const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')

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

    // 🔗 CONEXIÓN
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'connecting') {
            console.log('🔄 Conectando...')
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

    // 🔥 LECTURA DE MENSAJES (FIX DEFINITIVO)
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
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

            // 🔥 COMANDOS
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
                    text: "🤖 Bot activo correctamente en Railway 🚀"
                })
            }

        } catch (err) {
            console.log("❌ Error:", err)
        }
    })
}

startBot()

