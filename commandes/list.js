"use strict";
const { zokou } = require("../framework/zokou");
const moment = require("moment-timezone");
const os = require("os");
const s = require("../set");

const readMore = String.fromCharCode(8206).repeat(4001);

// Function to convert text to fancy fonts
const toFancyUppercaseFont = (text) => {
    const fonts = {
        'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌',
        'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙'
    };
    return text.split('').map(char => fonts[char] || char).join('');
};

const toFancyLowercaseFont = (text) => {
    const fonts = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ',
        'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.split('').map(char => fonts[char] || char).join('');
};

// Function to calculate bot runtime
function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " min, " : " mins, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " sec" : " secs") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

zokou({ 
    nomCom: "menu", 
    categorie: "Menu", 
    reaction: "♻️", 
    nomFichier: __filename 
}, async (dest, zk, commandeOptions) => {
    const { repondre, prefixe, ms, nomAuteurMessage } = commandeOptions;
    const { cm } = require("../framework/zokou");
    let coms = {};
    let mode = (s.MODE).toLocaleLowerCase() != "yes" ? "Private" : "Public";

    cm.map(async (com) => {
        if (!coms[com.categorie]) coms[com.categorie] = [];
        coms[com.categorie].push(com.nomCom);
    });

    moment.tz.setDefault("Africa/Dar_es_Salaam");
    const hour = moment().hour();
    let greeting = "Good Morning";
    if (hour >= 12 && hour < 18) greeting = "Good Afternoon";
    else if (hour >= 18) greeting = "Good Evening";
    else if (hour >= 22 || hour < 5) greeting = "Good Night";

    const date = moment().format('DD/MM/YYYY');
    const time = moment().format('HH:mm:ss');
    const liveLog = runtime(process.uptime());
    const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const img = 'https://files.catbox.moe/e51g2r.jpg';
    const imgs = 'https://files.catbox.moe/e51g2r.jpg';
    const muzikiUrl = 'https://files.catbox.moe/e4c48n.mp3';

    const infoMsg = `
╭┈┈┈┈━⊷
*┋* *ʜᴇʟʟᴏ :* ${nomAuteurMessage}
*┋* *ʙᴏᴛ :* *ARYAN-TECH 𝚳𝚵𝚴𝐔*
*┋* *ᴜᴘᴛɪᴍᴇ :* ${liveLog}
*┋* *ʀᴀᴍ :* ${ram} MB
*┋* *ᴘʀᴇғɪx :* [ ${s.PREFIXE} ]
*┋* *ᴍᴏᴅᴇ :* ${mode}
*┋* *ᴅᴀᴛᴇ :* ${date}
*┋* *ᴏᴡɴᴇʀ :*EDDY 
╰┈┈┈┈━⊷\n`;
    
    let menuMsg = ` *${greeting}* \n${readMore}`;
    
    for (const cat in coms) {
        menuMsg += `\n*「 ${toFancyUppercaseFont(cat)} 」*\n╭─━⊷`;
        for (const cmd of coms[cat]) {
            menuMsg += `\n*┋* ${toFancyLowercaseFont(cmd)}`;   
        }
        menuMsg += `\n╰─━⊷\n`;
    }
    
    menuMsg += `\n> ╔════════════════════════════╗
           ░░░░░▄▄▄▄▄░░░░░
           ░░░█▀───▀█░░░
           ░░░█─▀─▀─█░░░
           ░░░█──▄──█░░░
           ░░░▀█▄▄▄█▀░░░
╚════════════════════════════╝

⚠️ OWNER ⚠️:
┏━━━ ✨ »ARYAN-TECH 𝚳𝚵𝚴𝐔« ✨ ━━━┓
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
\n`;

    try {
        // Send Menu with Image
        await zk.sendMessage(dest, { 
            image: { url: img },
            caption: infoMsg + menuMsg,
            contextInfo: {
                externalAdReply: {
                    title: "ARYAN-TECH 𝚳𝚵𝚴𝐔",
                    body: `Welcome, ${nomAuteurMessage}`,
                    thumbnailUrl: imgs,
                    sourceUrl: "https://whatsapp.com/channel/0029VbBk9IKAjPXIih13Q33d",
                    mediaType: 1,
                    renderLargerThumbnail: true
                },
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363420172397674@newsletter",
                    newsletterName: "ARYAN-TECH Updates",
                    serverMessageId: 143
                }
            }
        }, { quoted: ms });

        // Send Audio (PTT/Voice Note)
        await zk.sendMessage(dest, {
            audio: { url: muzikiUrl },
            mimetype: 'audio/mp4',
            ptt: true,
            contextInfo: {
                externalAdReply: {
                    title: "ARYAN-TECH ₥Ɇ₦Ʉ ₱Ⱡ₳Ɏ",
                    body: `Playing Theme for ${nomAuteurMessage}`,
                    thumbnailUrl: imgs,
                    mediaType: 1
                }
            }
        }, { quoted: ms });

    } catch (error) {
        console.error("Menu Error: ", error);
        repondre("An error occurred: " + error);
    }
});
