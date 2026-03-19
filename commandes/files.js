"use strict";

const { zokou } = require("../framework/zokou");
const axios = require("axios");
const moment = require("moment-timezone");

zokou({
    nomCom: "files",
    aliases: ["list", "help"],
    categorie: "Owner",
    reaction: "👑"
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, nomAuteurMessage, superUser, sender } = commandeOptions;
    
    // --- SECURITY CHECK ---
    // Only the Owner (255784766591) or the Bot's own number can run this
    const botNumber = zk.user.id.split(":")[0] + "@s.whatsapp.net";
    const isBotSelf = sender === botNumber;

    if (!superUser && !isBotSelf) {
        return repondre("❌ *Restricted:* This system menu is only accessible by the Bot Owner.");
    }

    // --- GITHUB SETTINGS ---
    // Change 'YOUR_USERNAME/YOUR_REPO' to your actual GitHub path
    const ownerRepo = "YOUR_USERNAME/YOUR_REPO"; 
    const channelJid = "120363420172397674@newsletter";
    const audioUrl = "https://files.catbox.moe/lqx6sp.mp3";
    const ownerNumber = "255637518095";

    try {
        repondre("⌛ *Fetching secure system data from GitHub...*");

        const repoUrl = `https://api.github.com/repos/${ownerRepo}/contents/commands`;
        const response = await axios.get(repoUrl);
        const files = response.data;

        let menuMsg = `
╭─────────────━┈⊷•
│ 🤖 *𝙱𝙾𝚃:* ARYAN-TECH
│ 👤 *𝚄𝚂𝙴𝚁:* ${nomAuteurMessage}
│ 📂 *𝚂𝚃𝙰𝚃𝚄𝚂:* Owner Verified
╰─────────────━┈⊷•

*『 𝙶𝙸𝚃𝙷𝚄𝙱 𝙳𝙴𝙿𝙻𝙾𝚈𝙼𝙴𝙽𝚃 𝙻𝙾𝙶 』*
_Active command files and last update time:_
`;

        for (const file of files) {
            if (file.name.endsWith(".js")) {
                const commitUrl = `https://api.github.com/repos/${ownerRepo}/commits?path=commands/${file.name}&page=1&per_page=1`;
                const commitRes = await axios.get(commitUrl);
                const lastUpdate = commitRes.data[0].commit.committer.date;
                
                const date = moment(lastUpdate).tz("Africa/Nairobi").format("DD/MM/YYYY");
                const time = moment(lastUpdate).tz("Africa/Nairobi").format("HH:mm:ss");

                menuMsg += `\n📄 *File:* \`\`\`${file.name}\`\`\``;
                menuMsg += `\n📅 *Uploaded:* ${date} | ⌚ ${time}\n`;
            }
        }

        menuMsg += `\n*『 𝚂𝚈𝚂𝚃𝙴𝙼 𝙰𝙳𝙼𝙸𝙽 』*\n• *Owner:* wa.me/${ownerNumber}`;

        // 1. Send Menu Image
        await zk.sendMessage(dest, {
            image: { url: "https://files.catbox.moe/e51g2r.jpg" },
            caption: menuMsg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: "𝚃𝙸𝙼𝙽𝙰𝚂𝙰-𝚃𝙼𝙳 𝙰𝙳𝙼𝙸𝙽",
                    serverMessageId: 1
                }
            }
        }, { quoted: ms });

        // 2. Send Playable Audio
        await zk.sendMessage(dest, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: true,
            waveform: [0, 50, 100, 50, 100, 50, 0],
            contextInfo: {
                externalAdReply: {
                    title: "ÄŖŸÄŅ-TECH 𝚂𝙴𝙲𝚄𝚁𝙴 𝙼𝙴𝙽𝚄",
                    body: "Authorized Access Only",
                    thumbnailUrl: "https://files.catbox.moe/zm113g.jpg",
                    sourceUrl: `https://wa.me/${ownerNumber}`
                }
            }
        }, { quoted: ms });

    } catch (error) {
        console.error("GitHub Menu Error:", error);
        repondre("❌ *Error:* Could not link to GitHub. Check your Repository name.");
    }
});
