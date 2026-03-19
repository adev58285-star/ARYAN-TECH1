"use strict";

const { zokou } = require("../framework/zokou");
const axios = require("axios");

zokou({ nomCom: "alogo", categorie: "AI", reaction: "🎨" }, async (dest, zk, commandeOptions) => {
    const { arg, repondre, ms, prefixe } = commandeOptions;
    const channelJid = "120363420172397674@newsletter";

    if (!arg || arg.length === 0) {
        return repondre(`*What logo should I create?*\n\n*Example:* ${prefixe}alogo a futuristic neon logo for a gaming team named TIMNASA`);
    }

    const prompt = arg.join(" ");
    repondre("*🚀 ARYAN-TECH is generating your AI Logo... Please wait!*");

    try {
        // Using Pollinations AI API for high-quality image generation
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;

        await zk.sendMessage(dest, {
            image: { url: imageUrl },
            caption: `*🎨 AI LOGO GENERATED*\n\n*Prompt:* ${prompt}\n\n*System:* ARYAN 𝙰𝙸`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: "ARYAN-TECH 𝙰𝙸 𝙰𝚁𝚃",
                    serverMessageId: 1
                }
            }
        }, { quoted: ms });

    } catch (e) {
        console.log(e);
        repondre("🥵 An error occurred while generating the logo.");
    }
});
