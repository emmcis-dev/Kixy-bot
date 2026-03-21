const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '1.0.0'],
        version,
        auth: state
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('\n📱 ESCANEA ESTE QR:\n')
            qrcode.generate(qr) // 🔥 MÁS LEGIBLE
        }

        if (connection === 'open') {
            console.log('✅ BOT CONECTADO 🔥')
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('❌ Conexión cerrada:', reason)

            if (reason !== DisconnectReason.loggedOut) {
                console.log('🔄 Reintentando...')
                startBot()
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

startBot()
