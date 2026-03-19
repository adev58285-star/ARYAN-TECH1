"use strict";

const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { zokou } = require("../framework/zokou");
const traduire = require("../framework/traduction");
const fs = require("fs-extra");
const axios = require('axios');
const FormData = require('form-data');
const { exec } = require("child_process");

// Global Configuration
const channelJid = "120363420172397674@newsletter";
const thumb = "https://files.catbox.moe/e51g2r.jpg";

/**
 * Upload to Catbox (More reliable than Telegraph)
 */
async function uploadToCatbox(path) {
    try {
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", fs.createReadStream(path));
        bodyForm.append("reqtype", "fileupload");

        const { data } = await axios.post("https://catbox.moe/user/api.php", bodyForm, {
            headers: bodyForm.getHeaders(),
        });
        return data;
    } catch (err) {
        throw new Error("Catbox Upload Failed: " + err.message);
    }
}

// ================== STICKER COMMAND ==================
zokou({ nomCom: "sticker", aliases: ["s", "stiker"], categorie: "Conversion", reaction: "👨🏿‍💻" }, async (dest, zk, commandeOptions) => {
    const { ms, mtype, arg, repondre, nomAuteurMessage } = commandeOptions;

    try {
        let buffer;
        if (mtype === "imageMessage" || mtype === "videoMessage") {
            buffer = await zk.downloadMediaMessage(ms);
        } else if (ms.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = ms.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.imageMessage || quoted.videoMessage) {
                buffer = await zk.downloadMediaMessage({ message: quoted });
            }
        }

        if (!buffer) return repondre("Please mention an image or a short video!");

        const sticker = new Sticker(buffer, {
            pack: "Aryan-tech",
            author: nomAuteurMessage || "Timoth",
            type: arg.includes("crop") ? StickerTypes.CROPPED : StickerTypes.FULL,
            quality: 70,
        });

        const stickerBuffer = await sticker.toBuffer();
        await zk.sendMessage(dest, { sticker: stickerBuffer }, { quoted: ms });
    } catch (e) {
        repondre("Error creating sticker: " + e.message);
    }
});

// ================== PHOTO (Sticker to Image) ==================
zokou({ nomCom: "photo", categorie: "Conversion", reaction: "📸" }, async (dest, zk, commandeOptions) => {
    const { ms, msgRepondu, repondre } = commandeOptions;

    if (!msgRepondu || !msgRepondu.stickerMessage) return repondre("Mention a non-animated sticker.");

    try {
        const mediaPath = await zk.downloadAndSaveMediaMessage(msgRepondu.stickerMessage);
        const outPath = mediaPath + ".png";

        exec(`ffmpeg -i ${mediaPath} ${outPath}`, async (err) => {
            if (err) return repondre("Failed to convert sticker to photo.");
            
            await zk.sendMessage(dest, { image: fs.readFileSync(outPath), caption: "*Converted by Aryan tech*" }, { quoted: ms });
            fs.unlinkSync(mediaPath);
            fs.unlinkSync(outPath);
        });
    } catch (e) { repondre("Error: " + e.message); }
});

// ================== URL (Media to Link) ==================
zokou({ nomCom: "url", aliases: ["tourl"], categorie: "Conversion", reaction: "🔗" }, async (dest, zk, commandeOptions) => {
    const { ms, msgRepondu, repondre } = commandeOptions;

    if (!msgRepondu) return repondre("Mention an image, video, or audio.");

    try {
        repondre("*Uploading to server...*");
        const mediaPath = await zk.downloadAndSaveMediaMessage(msgRepondu.imageMessage || msgRepondu.videoMessage || msgRepondu.audioMessage);
        const url = await uploadToCatbox(mediaPath);
        fs.unlinkSync(mediaPath);

        await zk.sendMessage(dest, {
            text: `*ARYAN-TECH 𝚄𝚁𝙻 𝚄𝙿𝙻𝙾𝙰𝙳𝙴𝚁*\n\n🔗 *URL:* ${url}`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: "Aryan tech 𝙲𝙾𝙽𝚅𝙴𝚁𝚃𝙴𝚁",
                    serverMessageId: 1
                }
            }
        }, { quoted: ms });
    } catch (e) { repondre("Upload failed: " + e.message); }
});

// ================== TRANSLATE ==================
zokou({ nomCom: "trt", categorie: "Conversion", reaction: "🌍" }, async (dest, zk, commandeOptions) => {
    const { msgRepondu, arg, repondre } = commandeOptions;

    if (!msgRepondu || !msgRepondu.conversation && !msgRepondu.extendedTextMessage?.text) {
        return repondre("Mention a text message to translate.");
    }

    const targetLang = arg[0] || "en";
    const textToTranslate = msgRepondu.conversation || msgRepondu.extendedTextMessage.text;

    try {
        const translated = await traduire(textToTranslate, { to: targetLang });
        repondre(`*Translation (${targetLang}):*\n\n${translated}`);
    } catch (e) { repondre("Translation error: " + e.message); }
});
