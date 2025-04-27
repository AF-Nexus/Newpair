const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { ByteID } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = ByteID();
    let num = req.query.number;
    let attempt = 0; // Counter for retry attempts

    // Validate phone number
    if (!num || num.trim() === '') {
        return res.status(400).send({ error: "Phone number is required" });
    }

    async function Byte_Pair() {
        // Ensure directory exists
        if (!fs.existsSync('./temp/' + id)) {
            fs.mkdirSync('./temp/' + id, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        
        try {
            const logger = pino({ 
                level: process.env.NODE_ENV === 'production' ? "fatal" : "warn"
            });
            
            let Hamza = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger.child({ level: "fatal" })),
                },
                printQRInTerminal: true, // Set to true for debugging
                logger: logger,
                browser: Browsers.appropriate(),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                markOnlineOnConnect: false,
                generateHighQualityLinkPreview: false,
                syncFullHistory: false
            });

            Hamza.ev.on('creds.update', saveCreds);
            
            Hamza.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                console.log('Connection state:', connection);
                
                if (connection === "open") {
                    console.log("Connected to WhatsApp!");
                    // Send initial message after linking
                    let initialMessage = `*_EF-prime-MD is processing your session id stay alert..._*`;
                    await Hamza.sendMessage(Hamza.user.id, { text: initialMessage });

                    await delay(20000); // Delay for 20 seconds before sending the session

                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    await delay(800); // Small delay before processing the credentials

                    // Encode credentials to base64 and send session message
                    let b64data = Buffer.from(data).toString('base64');
                    let session = await Hamza.sendMessage(Hamza.user.id, { text: 'EF-PRIME;;;' + b64data });
                    await delay(8000);
                    
                    // Send final BYTE_MD_TEXT message
                    let Byte_MD_TEXT = `🤖 𝗘𝗙-𝗣𝗥𝗜𝗠𝗘 𝗔𝗨𝗧𝗛𝗘𝗡𝗧𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗠𝗔𝗧𝗥𝗜𝗫🤖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 𝗔𝗨𝗧𝗢𝗕𝗢𝗧𝗦, 𝗦𝗘𝗦𝗦𝗜𝗢𝗡 𝗦𝗘𝗖𝗨𝗥𝗘𝗗! 🤖
🚫 𝗞𝗘𝗘𝗣 𝗙𝗥𝗢𝗠 𝗗𝗘𝗖𝗘𝗣𝗧𝗜𝗖𝗢𝗡𝗦 🚫

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 𝗖𝗬𝗕𝗘𝗥𝗧𝗥𝗢𝗡 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗖𝗘𝗡𝗧𝗘𝗥 🔥
🌐 https://whatsapp.com/channel/0029Vb5xaN6Chq6HbdmixE44

✨ "𝗙𝗥𝗘𝗘𝗗𝗢𝗠 𝗜𝗦 𝗧𝗛𝗘 𝗥𝗜𝗚𝗛𝗧 𝗢𝗙 𝗔𝗟𝗟 𝗦𝗘𝗡𝗧𝗜𝗘𝗡𝗧 𝗕𝗘𝗜𝗡𝗚𝗦." ✨`;
                    await Hamza.sendMessage(Hamza.user.id, { text: Byte_MD_TEXT }, { quoted: session });

                    await delay(100); // Delay before closing connection
                    await Hamza.ws.close(); // Close the WebSocket connection
                    return await removeFile('./temp/' + id); // Remove the temporary files
                
                } else if (connection === "close") {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const reason = lastDisconnect?.error?.output?.payload?.error || "Unknown";
                    console.log(`Connection closed. Status code: ${statusCode}, Reason: ${reason}`);
                    
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    if (shouldReconnect && attempt < 1) {
                        attempt++;
                        console.log(`Reconnecting (attempt ${attempt})...`);
                        await delay(10000); // Wait before retrying
                        Byte_Pair(); // Retry connection
                    } else {
                        console.log("Max retry attempts reached or logged out");
                        await removeFile('./temp/' + id);
                        if (!res.headersSent) {
                            await res.send({ code: "Service Unavailable", reason: reason });
                        }
                    }
                } else if (connection === "connecting") {
                    console.log("Connecting to WhatsApp...");
                }
            });
            
            // Handle pairing code request
            Hamza.ev.on('connection.update', async ({ connection }) => {
                if (!res.headersSent && !Hamza.authState.creds.registered) {
                    try {
                        // Clean and format phone number
                        num = num.replace(/[^0-9]/g, '');
                        // Format as international number if needed
                        if (!num.startsWith('+')) {
                            num = `+${num}`;
                        }
                        
                        console.log(`Requesting pairing code for phone: ${num}`);
                        
                        // Wait a bit for connection to stabilize
                        await delay(3000);
                        
                        // Request pairing code
                        const code = await Hamza.requestPairingCode(num);
                        console.log(`Generated pairing code: ${code}`);
                        
                        // Send response to client
                        res.send({ code: code });
                    } catch (err) {
                        console.error("Error requesting pairing code:", err);
                        // Only send response if headers not sent yet
                        if (!res.headersSent) {
                            res.status(500).send({ 
                                error: "Failed to generate pairing code", 
                                details: err.message 
                            });
                        }
                    }
                }
            });
            
        } catch (err) {
            console.error("Service error:", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                res.status(500).send({ 
                    error: "Service Unavailable", 
                    details: err.message 
                });
            }
        }
    }

    return await Byte_Pair();
});

module.exports = router;
