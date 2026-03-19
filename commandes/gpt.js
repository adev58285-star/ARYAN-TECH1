"use strict";

const { zokou } = require("../framework/zokou");
const axios = require("axios");

zokou({ nomCom: "gpt", aliases: ["ai", "gpt4", "ask"], categorie: "AI", reaction: "🤖" }, async (dest, zk, commandeOptions) => {
    const { arg, repondre, ms, prefixe, auteurMessage } = commandeOptions;
    const channelJid = "120363420172397674@newsletter";

    if (!arg || arg.length === 0) {
        return repondre(`*Hello @${auteurMessage.split('@')[0]}, how can I help you today?*\n\n*Example:* ${prefixe}gpt What is Quantum Physics?`);
    }

    const prompt = arg.join(" ");

    try {
        // High-speed GPT-4 API
        const response = await axios.get(`https://api.maher-zubair.tech/ai/chatgpt?q=${encodeURIComponent(prompt)}`);
        
        if (!response.data || !response.data.result) {
            throw new Error("Invalid API response");
        }

        const result = response.data.result;

        await zk.sendMessage(dest, {
            text: `*ARYAN-TECH 𝙶𝙿𝚃-𝟺 𝙰𝙸*\n\n${result}\n\n*Requested by:* @${auteurMessage.split('@')[0]}`,
            mentions: [auteurMessage],
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: "ARYAN 𝙰𝙸 𝙰𝚂𝚂𝙸𝚂𝚃𝙰𝙽𝚃",
                    serverMessageId: 1
                },
                externalAdReply: {
                    title: "𝙶𝙿𝚃-𝟺 𝙸𝙽𝚃𝙴𝙻𝙻𝙸𝙶𝙴𝙽𝙲𝙴",
                    body: "Powered by ARYAN",
                    thumbnailUrl: "https://files.catbox.moe/zm113g.jpg",
                    sourceUrl: "https://whatsapp.com/channel/0029VbBk9IKAjPXIih13Q33d",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: ms });

    } catch (e) {
        console.log(e);
        repondre("🥵 *GPT-4 is currently busy or rate-limited. Please try again in a moment.*");
    }
});
