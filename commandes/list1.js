"use strict";

const { zokou } = require("../framework/zokou");
const conf = require("../set");
const os = require("os");
const moment = require("moment-timezone");

zokou({
    nomCom: "list",
    aliases: ["help", "list"],
    categorie: "General",
    reaction: "👑"
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, prefixe, nomAuteurMessage } = commandeOptions;
    const { cm } = require(__dirname + "/../framework/zokou"); // Accesses the command registry
    const channelJid = "120363420172397674@newsletter";

    try {
        // Date and Time Setup
        const date = moment().tz("Africa/Nairobi").format("DD/MM/YYYY");
        const time = moment().tz("Africa/Nairobi").format("HH:mm:ss");
        
        // Organize commands by category
        const list_menu = {};
        cm.forEach((command) => {
            if (!list_menu[command.categorie]) {
                list_menu[command.categorie] = [];
            }
            list_menu[command.categorie].push(command.nomCom);
        });

        // Menu Header
        let menuMsg = `
╭─────────────━┈⊷•
│ 🤖 *𝙱𝙾𝚃:* ARYAN-TECH 
│ 👤 *𝚄𝚂𝙴𝚁:* ${nomAuteurMessage}
│ 📅 *𝙳𝙰𝚃𝙴:* ${date}
│ ⌚ *𝚃𝙸𝙼𝙴:* ${time}
│ ⏳ *𝚄𝙿𝚃𝙸𝙼𝙴:* ${process.uptime().toFixed(0)}s
╰─────────────━┈⊷•

*𝙻𝙸𝚂𝚃 𝙾𝙵 𝙰𝚅𝙰𝙸𝙻𝙰𝙱𝙻𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂:*
`;

        // Sort categories and list commands
        const categories = Object.keys(list_menu).sort();
        for (const cat of categories) {
            menuMsg += `\n*◈───╼[ ${cat.toUpperCase()} ]╾───◈*\n`;
            for (const cmd of list_menu[cat]) {
                menuMsg += `  ☞ ${prefixe}${cmd}\n`;
            }
        }

        menuMsg += `\n\n_Powered by ARYAN 𝚂𝚈𝚂𝚃𝙴𝙼_`;

        // Profile Picture or Menu Image
        let menuImg;
        try {
            menuImg = await zk.profilePictureUrl(zk.user.id, 'image');
        } catch {
            menuImg = conf.IMAGE_MENU || "https://files.catbox.moe/e51g2r.jpg";
        }

        // Send Menu with Professional Context
        await zk.sendMessage(dest, {
            image: { url: menuImg },
            caption: menuMsg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: "ARYAN-TECH 𝙰𝚄𝚃𝙾 𝙼𝙴𝙽𝚄",
                    serverMessageId: 1
                },
                externalAdReply: {
                    title: "ARYAN-TECH 𝙾𝙵𝙵𝙸𝙲𝙸𝙰𝙻 𝙼𝙴𝙽𝚄",
                    body: "Advanced WhatsApp Bot System",
                    thumbnailUrl: menuImg,
                    sourceUrl: "https://whatsapp.com/channel/0029VbBk9IKAjPXIih13Q33d",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: ms });

    } catch (error) {
        console.error("Menu Error:", error);
        repondre("❌ An error occurred while loading the menu: " + error.message);
    }
});
