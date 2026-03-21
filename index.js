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

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log('✅ BOT CONECTADO 🔥')
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('❌ Conexión cerrada:', reason)

            if (reason !== DisconnectReason.loggedOut) {
                startBot()
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔥 RESPONDER MENSAJES
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

            console.log("📩", text)

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
