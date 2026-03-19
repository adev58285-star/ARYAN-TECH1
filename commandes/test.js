"use strict";

const { zokou } = require("../framework/zokou");

zokou({
    nomCom: "test",
    categorie: "General",
    reaction: "🚀"
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre } = commandeOptions;
    const channelJid = "120363420172397674@newsletter";
    const audioUrl = "https://files.catbox.moe/lqx6sp.mp3";
    
    // Media Links
    const imageUrl1 = "https://files.catbox.moe/zm113g.jpg"; 
    const imageUrl2 = "https://files.catbox.moe/zm113g.jpg"; 

    try {
        const testMsg = `*𝚃𝙸𝙼𝙽𝙰𝚂𝙰-𝚃𝙼𝙳 𝚂𝚈𝚂𝚃𝙴𝙼 𝙲𝙷𝙴𝙲𝙺* ⚡\n\n` +
            `*Status:* 𝙾𝙽𝙻𝙸𝙽𝙴\n` +
            `*Engine:* Aryan 𝚅2\n` +
            `*Owner:* ARYAN-TECH\n` +
            `*Timestamp:* ${new Date().toLocaleString()}\n\n` +
            `_System is running smoothly with media support._`;

        // 1. Send First Image with Caption
        await zk.sendMessage(dest, {
            image: { url: imageUrl1 },
            caption: testMsg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: "ARYAN-TECH 𝚂𝙴𝙲𝚄𝚁𝙸𝚃𝚈",
                    serverMessageId: 1
                }
            }
        }, { quoted: ms });

        // 2. Send Second Image
        await zk.sendMessage(dest, {
            image: { url: imageUrl2 },
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: "ARYAN-TECHV𝚂𝙴𝙲𝚄𝚁𝙸𝚃𝚈"
                }
            }
        }, { quoted: ms });

        // 3. Send Audio (FIXED: Added the missing closing quote for mimetype)
        await zk.sendMessage(dest, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: true,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: "ARYAN 𝙰𝚄𝙳𝙸𝙾"
                }
            }
        }, { quoted: ms });

    } catch (error) {
        console.error("Test Command Error:", error);
        repondre("❌ Error: " + error.message);
    }
});
