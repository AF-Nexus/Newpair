const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { ByteID } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { default: Byte, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers } = require("@whiskeysockets/baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Add more verbose logging
const logger = pino({ 
    level: "info", // Change to info to see more logs
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});

router.get('/', async (req, res) => {
    const id = ByteID();
    let num = req.query.number;
    let attempt = 0; // Counter for retry attempts
    
    // Log the incoming request
    console.log(`Pairing request received for number: ${num}`);

    // Check if number is provided
    if (!num) {
        return res.status(400).send({ error: "Phone number is required" });
    }

    async function Byte_Pair() {
        console.log(`Creating auth state for ID: ${id}`);
        try {
            // Ensure temp directory exists
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp');
            }
            if (!fs.existsSync(`./temp/${id}`)) {
                fs.mkdirSync(`./temp/${id}`);
            }

            const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
            console.log("Auth state created successfully");
            
            try {
                console.log("Initializing WhatsApp connection...");
                let Hamza = Byte({
                    auth: {
                        creds: state.creds,
                        keys: makeCacheableSignalKeyStore(state.keys, logger.child({ level: "fatal" })),
                    },
                    printQRInTerminal: false,
                    logger: logger.child({ level: "fatal" }),
                    browser: ["Chrome (Linux)", "", ""]
                });

                console.log("WhatsApp connection initialized");

                if (!Hamza.authState.creds.registered) {
                    console.log("Device not registered, requesting pairing code");
                    await delay(1500);
                    
                    // Clean the number
                    num = num.replace(/[^0-9]/g, '');
                    console.log(`Cleaned phone number: ${num}`);
                    
                    try {
                        console.log("Requesting pairing code...");
                        const code = await Hamza.requestPairingCode(num);
                        console.log(`Pairing code generated: ${code}`);
                        
                        if (!res.headersSent) {
                            console.log("Sending pairing code to client");
                            return res.send({ code });
                        }
                    } catch (pairingError) {
                        console.error("Error requesting pairing code:", pairingError);
                        if (!res.headersSent) {
                            return res.status(500).send({ 
                                error: "Failed to generate pairing code", 
                                details: pairingError.message 
                            });
                        }
                    }
                }

                Hamza.ev.on('creds.update', saveCreds);
                Hamza.ev.on("connection.update", async (s) => {
                    console.log("Connection update:", s);
                    const { connection, lastDisconnect } = s;
                    
                    if (connection == "open") {
                        console.log("Connection established successfully");
                        
                        // Send initial message after linking
                        let initialMessage = `*_EF-prime-MD is processing your session id stay alert..._*`;
                        try {
                            await Hamza.sendMessage(Hamza.user.id, { text: initialMessage });
                            console.log("Initial message sent");

                            await delay(5000); // Reduced delay for testing

                            console.log(`Reading credentials from: ${__dirname}/temp/${id}/creds.json`);
                            let data = fs.readFileSync(`${__dirname}/temp/${id}/creds.json`);
                            console.log("Credentials read successfully");
                            
                            // Encode credentials to base64 and send session message
                            let b64data = Buffer.from(data).toString('base64');
                            console.log("Sending session data");
                            let session = await Hamza.sendMessage(Hamza.user.id, { text: 'EF-PRIME;;;' + b64data });
                            console.log("Session data sent");
                            
                            await delay(2000); // Reduced delay for testing
                            
                            // Send final BYTE_MD_TEXT message
                            let Byte_MD_TEXT = `🤖 𝗘𝗙-𝗣𝗥𝗜𝗠𝗘 𝗔𝗨𝗧𝗛𝗘𝗡𝗧𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗠𝗔𝗧𝗥𝗜𝗫🤖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 𝗔𝗨𝗧𝗢𝗕𝗢𝗧𝗦, 𝗦𝗘𝗦𝗦𝗜𝗢𝗡 𝗦𝗘𝗖𝗨𝗥𝗘𝗗! 🤖
🚫 𝗞𝗘𝗘𝗣 𝗙𝗥𝗢𝗠 𝗗𝗘𝗖𝗘𝗣𝗧𝗜𝗖𝗢𝗡𝗦 🚫

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 𝗖𝗬𝗕𝗘𝗥𝗧𝗥𝗢𝗡 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗖𝗘𝗡𝗧𝗘𝗥 🔥
🌐 https://whatsapp.com/channel/0029Vb5xaN6Chq6HbdmixE44

✨ "𝗙𝗥𝗘𝗘𝗗𝗢𝗠 𝗜𝗦 𝗧𝗛𝗘 𝗥𝗜𝗚𝗛𝗧 𝗢𝗙 𝗔𝗟𝗟 𝗦𝗘𝗡𝗧𝗜𝗘𝗡𝗧 𝗕𝗘𝗜𝗡𝗚𝗦." ✨`;
                            console.log("Sending final message");
                            await Hamza.sendMessage(Hamza.user.id, { text: Byte_MD_TEXT }, { quoted: session });
                            console.log("Final message sent");

                            console.log("Closing connection and cleaning up");
                            await delay(1000);
                            await Hamza.ws.close();
                            return await removeFile(`./temp/${id}`);
                        } catch (msgError) {
                            console.error("Error in message sending flow:", msgError);
                            await removeFile(`./temp/${id}`);
                            if (!res.headersSent) {
                                return res.status(500).send({ error: "Error in session processing" });
                            }
                        }
                    } else if (connection === "close") {
                        console.log("Connection closed");
                        if (lastDisconnect && lastDisconnect.error) {
                            console.error("Disconnect error:", lastDisconnect.error);
                            if (lastDisconnect.error.output && lastDisconnect.error.output.statusCode != 401) {
                                if (attempt < 2) { // Increased max attempts
                                    attempt++;
                                    console.log(`Retrying connection (Attempt ${attempt})`);
                                    await delay(5000); // Reduced wait time before retry
                                    return Byte_Pair(); // Retry connection
                                } else {
                                    console.log("Max retry attempts reached");
                                    await removeFile(`./temp/${id}`);
                                    if (!res.headersSent) {
                                        return res.status(500).send({ error: "Max retry attempts reached" });
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (err) {
                console.error("WhatsApp setup error:", err);
                await removeFile(`./temp/${id}`);
                if (!res.headersSent) {
                    return res.status(500).send({ error: "WhatsApp setup error", details: err.message });
                }
            }
        } catch (authErr) {
            console.error("Auth state error:", authErr);
            await removeFile(`./temp/${id}`);
            if (!res.headersSent) {
                return res.status(500).send({ error: "Auth state error", details: authErr.message });
            }
        }
    }

    return await Byte_Pair();
});

module.exports = router;
