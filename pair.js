
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

router.get('/', async (req, res) => {
    const id = ByteID();
    let num = req.query.number;
    let attempt = 0;

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
                    let initialMessage = `*_EF-prime-MD is processing your session id stay alert..._*`;
                    await Hamza.sendMessage(Hamza.user.id, { text: initialMessage });
                    await delay(20000);

                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    await delay(800);
                    let b64data = Buffer.from(data).toString('base64');
                    let session = await Hamza.sendMessage(Hamza.user.id, { text: 'EF-PRIME;;;' + b64data });
                    await delay(8000)

                    let Byte_MD_TEXT = `🤖 𝗘𝗙-𝗣𝗥𝗜𝗠𝗘 𝗔𝗨𝗧𝗛𝗘𝗡𝗧𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗠𝗔𝗧𝗥𝗜𝗫🤖 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🤖 𝗔𝗨𝗧𝗢𝗕𝗢𝗧𝗦, 𝗦𝗘𝗦𝗦𝗜𝗢𝗡 𝗦𝗘𝗖𝗨𝗥𝗘𝗗! 🤖 🚫 𝗞𝗘𝗘𝗣 𝗙𝗥𝗢𝗠 𝗗𝗘𝗖𝗘𝗣𝗧𝗜𝗖𝗢𝗡𝗦 🚫 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🔥 𝗖𝗬𝗕𝗘𝗥𝗧𝗥𝗢𝗡 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗖𝗘𝗡𝗧𝗘𝗥 🔥 🌐 https://whatsapp.com/channel/0029Vb5xaN6Chq6HbdmixE44 ✨ "𝗙𝗥𝗘𝗘𝗗𝗢𝗠 𝗜𝗦 𝗧𝗛𝗘 𝗥𝗜𝗚𝗛𝗧 𝗢𝗙 𝗔𝗟𝗟 𝗦𝗘𝗡𝗧𝗜𝗘𝗡𝗧 𝗕𝗘𝗜𝗡𝗚𝗦." ✨`;
                    await Hamza.sendMessage(Hamza.user.id, { text: Byte_MD_TEXT }, { quoted: session });
                    await delay(100);
                    await Hamza.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    if (attempt < 1) {
                        attempt++;
                        await delay(10000);
                        Byte_Pair();
                    } else {
                        console.log("Max retry attempts reached");
