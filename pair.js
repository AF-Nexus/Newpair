const { ByteID } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: Byte,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("whiskeysockets/baileys");

const PASTEBIN_API_KEY = 'EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL';

/**
 * Uploads content to Pastebin, handling different input types like text, files, and base64 data.
 * @param {string | Buffer} input - The content to upload, can be text, file path, or base64 data.
 * @param {string} [title] - Optional title for the paste.
 * @param {string} [format] - Optional syntax highlighting format (e.g., 'text', 'python', 'javascript').
 * @param {string} [privacy] - Optional privacy setting (0 = public, 1 = unlisted, 2 = private).
 * @returns {Promise<string>} - The custom URL of the created paste.
 */
async function uploadToPastebin(input, title = 'Untitled', format = 'json', privacy = '1') {
    try {
        // Dynamically import the `pastebin-api` ES module
        const { PasteClient, Publicity } = await import('pastebin-api');
        // Initialize the Pastebin client
        const client = new PasteClient(PASTEBIN_API_KEY);
        // Map privacy settings to `pastebin-api`'s Publicity enum
        const publicityMap = {
            '0': Publicity.Public,
            '1': Publicity.Unlisted,
            '2': Publicity.Private,
        };

        let contentToUpload = '';
        // Detect the type of input and process accordingly
        if (Buffer.isBuffer(input)) {
            // If the input is a Buffer (file content), convert it to string
            contentToUpload = input.toString();
        } else if (typeof input === 'string') {
            if (input.startsWith('data:')) {
                // If the input is a base64 string, extract the actual base64 data
                const base64Data = input.split(',')[1];
                contentToUpload = Buffer.from(base64Data, 'base64').toString();
            } else if (input.startsWith('http://') || input.startsWith('https://')) {
                // If it's a URL, treat it as plain text
                contentToUpload = input;
            } else if (fs.existsSync(input)) {
                // If the input is a file path, read the file (assume it's creds.json in this case)
                contentToUpload = fs.readFileSync(input, 'utf8');
            } else {
                // Otherwise, treat it as plain text (code snippet or regular text)
                contentToUpload = input;
            }
        } else {
            throw new Error('Unsupported input type. Please provide text, a file path, or base64 data.');
        }

        // Upload the paste
        const pasteUrl = await client.createPaste({
            code: contentToUpload,
            expireDate: 'N', // Never expire
            format: format, // Syntax highlighting format (set to 'json')
            name: title, // Title of the paste
            publicity: publicityMap[privacy], // Privacy setting
        });

        console.log('Original Pastebin URL:', pasteUrl);
        // Manipulate the URL: Remove 'https://pastebin.com/' and prepend custom words
        const pasteId = pasteUrl.replace('https://pastebin.com/', '');
        const customUrl = `EF-PRIME-MD_${pasteId}`;
        console.log('Custom URL:', customUrl);
        // Return the custom URL
        return customUrl;
    } catch (error) {
        console.error('Error uploading to Pastebin:', error);
        throw error;
    }
}

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = ByteID();
    let num = req.query.number;
    let attempt = 0; // Counter for retry attempts

    async function Byte_Pair() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let Hamza = Byte({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Chrome (Linux)", "", ""]
            });

            if (!Hamza.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Hamza.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Hamza.ev.on('creds.update', saveCreds);
            Hamza.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection == "open") {
                    // Send initial message after linking
                    let initialMessage = `*_EF-prime-MD is processing your session id stay alert..._*`;
                    await Hamza.sendMessage(Hamza.user.id, { text: initialMessage });

                    await delay(3000); // Delay for 3 seconds before sending the session

                    // Path to credentials file
                    const credsPath = __dirname + `/temp/${id}/creds.json`;
                    
                    try {
                        // Upload credentials to Pastebin and get the custom URL
                        const sessionId = await uploadToPastebin(
                            credsPath,
                            'EF-PRIME-MD Session',
                            'json',
                            '1' // Unlisted
                        );
                        
                        // Send the session ID message
                        let session = await Hamza.sendMessage(Hamza.user.id, { text: `Your Session ID: ${sessionId}` });
                        
                        await delay(3000);

                        // Send final BYTE_MD_TEXT message
                        let Byte_MD_TEXT = `🤖 𝗘𝗙-𝗣𝗥𝗜𝗠𝗘 𝗔𝗨𝗧𝗛𝗘𝗡𝗧𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗠𝗔𝗧𝗥𝗜𝗫🤖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 𝗔𝗨𝗧𝗢𝗕𝗢𝗧𝗦, 𝗦𝗘𝗦𝗦𝗜𝗢𝗡 𝗦𝗘𝗖𝗨𝗥𝗘𝗗! 🤖
🚫 𝗞𝗘𝗘𝗣 𝗙𝗥𝗢𝗠 𝗗𝗘𝗖𝗘𝗣𝗧𝗜𝗖𝗢𝗡𝗦 🚫

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 𝗖𝗬𝗕𝗘𝗥𝗧𝗥𝗢𝗡 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗖𝗘𝗡𝗧𝗘𝗥 🔥
🌐 https://whatsapp.com/channel/0029Vb5xaN6Chq6HbdmixE44

✨ "𝗙𝗥𝗘𝗘𝗗𝗢𝗠 𝗜𝗦 𝗧𝗛𝗘 𝗥𝗜𝗚𝗛𝗧 𝗢𝗙 𝗔𝗟𝗟 𝗦𝗘𝗡𝗧𝗜𝗘𝗡𝗧 𝗕𝗘𝗜𝗡𝗚𝗦." ✨

📌 Your Session ID: ${sessionId}`;
                        await Hamza.sendMessage(Hamza.user.id, { text: Byte_MD_TEXT }, { quoted: session });

                        // Store session metadata
                        await uploadToPastebin(
                            JSON.stringify({
                                id: sessionId,
                                created: new Date().toISOString(),
                                sessionType: 'EF-PRIME-MD'
                            }),
                            'EF-PRIME-MD Session Metadata',
                            'json',
                            '1'
                        );
                    } catch (error) {
                        console.error('Failed to upload to Pastebin:', error);
                        // If Pastebin upload fails, send a fallback message
                        await Hamza.sendMessage(Hamza.user.id, { text: 'Error generating session ID. Please try again later.' });
                    }

                    await delay(100); // Delay before closing connection
                    await Hamza.ws.close(); // Close the WebSocket connection
                    return await removeFile('./temp/' + id); // Remove the temporary files
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    if (attempt < 1) { // Retry only once
                        attempt++;
                        await delay(10000); // Wait before retrying
                        Byte_Pair(); // Retry connection
                    } else {
                        console.log("Max retry attempts reached");
                        await removeFile('./temp/' + id);
                        if (!res.headersSent) {
                            await res.send({ code: "Service Unavailable" });
                        }
                    }
                }
            });
        } catch (err) {
            console.log("Service error:", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }

    return await Byte_Pair();
});

module.exports = router;
