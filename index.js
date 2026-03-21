const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: ['Android', 'Chrome', '1.0.0'],
        version,
        auth: state,
        markOnlineOnConnect: true,
        syncFullHistory: true,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: undefined
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('\n📱 ESCANEA EL QR:\n')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            console.log('✅ BOT CONECTADO Y LISTO 🔥')

            // 🔥 FORZAR PRESENCIA (CLAVE)
            await sock.sendPresenceUpdate('available')
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('❌ Conexión cerrada:', reason)

            if (reason !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconectando...')
                startBot()
            } else {
                console.log('🚫 Sesión cerrada, elimina session y escanea de nuevo')
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔥 LECTOR FORZADO (FIX REAL)
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
                msg.message.imageMessage?.caption ||
                msg.message.videoMessage?.caption ||
                ""

            if (!text) return

            console.log("📩 MENSAJE DETECTADO:", text)

            const prefix = "!"
            if (!text.startsWith(prefix)) return

            const command = text.slice(1).trim().split(" ")[0].toLowerCase()

            if (command === "ping") {
                await sock.sendMessage(from, { text: "🏓 Pong funcionando 🔥" })
            }

            if (command === "menu") {
                await sock.sendMessage(from, {
                    text: "📜 Menu:\n!ping\n!menu\n!info"
                })
            }

            if (command === "info") {
                await sock.sendMessage(from, {
                    text: "🤖 Bot activo correctamente en Termux 🚀"
                })
            }

        } catch (err) {
            console.log("❌ Error:", err)
        }
    })
}

startBot()
