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
        syncFullHistory: true // 🔥 IMPORTANTE
    })

    sock.ev.process(async (events) => {

        // 🔗 CONEXIÓN
        if (events['connection.update']) {
            const { connection, lastDisconnect } = events['connection.update']

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
        }

        // 💾 GUARDAR SESIÓN
        if (events['creds.update']) {
            await saveCreds()
        }

        // 🔥 MENSAJES (FIX REAL)
        if (events['messages.upsert']) {
            const m = events['messages.upsert']
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
                    text: "🤖 Bot activo correctamente 🚀"
                })
            }
        }
    })
}

startBot()
