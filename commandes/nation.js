"use strict";

const { zokou } = require(__dirname + "/../framework/zokou");

// 1. NATION DATA (List of countries and their calling codes)
const nationData = {
  "tanzania": { flag: "🇹🇿", code: "255", song: "https://files.catbox.moe/e4c48n.mp3" },
  "kenya": { flag: "🇰🇪", code: "254", song: "https://files.catbox.moe/e4c48n.mp3" },
  "uganda": { flag: "🇺🇬", code: "256", song: "https://files.catbox.moe/e4c48n.mp3" },
  "zambia": { flag: "🇿🇲", code: "260", song: "https://files.catbox.moe/e4c48n.mp3" },
  "zimbabwe": { flag: "🇿🇼", code: "263", song: "https://files.catbox.moe/e4c48n.mp3" },
  "southafrica": { flag: "🇿🇦", code: "27", song: "https://files.catbox.moe/e4c48n.mp3" },
  "nigeria": { flag: "🇳🇬", code: "234", song: "https://files.catbox.moe/e4c48n.mp3" },
  "rwanda": { flag: "🇷🇼", code: "250", song: "https://files.catbox.moe/e4c48n.mp3" },
  "burundi": { flag: "🇧🇮", code: "257", song: "https://files.catbox.moe/e4c48n.mp3" },
  "malawi": { flag: "🇲🇼", code: "265", song: "https://files.catbox.moe/e4c48n.mp3" },
  "somalia": { flag: "🇸🇴", code: "252", song: "https://files.catbox.moe/e4c48n.mp3" },
  "ethiopia": { flag: "🇪🇹", code: "251", song: "https://files.catbox.moe/e4c48n.mp3" },
  "congo": { flag: "🇨🇩", code: "243", song: "https://files.catbox.moe/e4c48n.mp3" },
  "pakistan": { flag: "🇵🇰", code: "92", song: "https://files.catbox.moe/e4c48n.mp3" },
  "usa": { flag: "🇺🇸", code: "1", song: "https://files.catbox.moe/e4c48n.mp3" },
  "india": { flag: "🇮🇳", code: "91", song: "https://files.catbox.moe/e4c48n.mp3" },
  "england": { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "44", song: "https://files.catbox.moe/e4c48n.mp3" }
};

// 2. COMMAND: NATION MENU
zokou({
    nomCom: "nationmenu",
    categorie: "Group",
    reaction: "📜"
}, async (dest, zk, commandeOptions) => {
    const { repondre, prefixe } = commandeOptions;
    let list = "╔══════════════════╗\n";
    list += "║   🌍 *ARYAN-TECH NATIONS* \n";
    list += "╚══════════════════╝\n\n";
    list += `Use: *${prefixe}allnations* to tag everyone by their country.\n\n`;
    
    Object.keys(nationData).sort().forEach(n => {
        list += `🔹 ${prefixe}${n} ${nationData[n].flag}\n`;
    });
    
    list += `\n*© Aryan 2026*`;
    repondre(list);
});

// 3. COMMAND: ALL NATIONS (GLOBAL TAG)
zokou({
    nomCom: "allnations",
    categorie: "Group",
    reaction: "🗺️"
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, verifGroupe, infosGroupe, verifAdmin, superUser } = commandeOptions;
    if (!verifGroupe) return repondre("✋🏿 This command is for groups only!");
    if (!(verifAdmin || superUser)) return repondre("❌ Admins only!");

    try {
        let participants = await infosGroupe.participants;
        let finalTag = `╭─────────────━┈⊷\n│  🌍 *GLOBAL TAG BY ARYAN* \n╰─────────────━┈⊷\n\n`;
        let mentions = [];

        Object.keys(nationData).forEach(key => {
            const country = nationData[key];
            const filtered = participants.filter(p => p.id.startsWith(country.code));
            if (filtered.length > 0) {
                finalTag += `*${country.flag} ${key.toUpperCase()}*\n`;
                filtered.forEach(m => {
                    finalTag += `◦ @${m.id.split("@")[0]}\n`;
                    mentions.push(m.id);
                });
                finalTag += `\n`;
            }
        });

        if (mentions.length === 0) return repondre("No numbers from registered countries found here.");

        await zk.sendMessage(dest, { text: finalTag, mentions: mentions }, { quoted: ms });
        await zk.sendMessage(dest, { audio: { url: "https://files.catbox.moe/e4c48n.mp3" }, mimetype: "audio/mp4", ptt: true }, { quoted: ms });
    } catch (e) { repondre("Error: " + e.message); }
});

// 4. INDIVIDUAL TAG ENGINE
async function executeTag(dest, zk, opts, key) {
    const { ms, repondre, arg, verifGroupe, infosGroupe, verifAdmin, superUser } = opts;
    if (!verifGroupe) return repondre("Groups only!");
    if (!(verifAdmin || superUser)) return repondre("Admins only!");

    const nation = nationData[key];
    await zk.sendMessage(dest, { react: { text: nation.flag, key: ms.key } });

    let participants = await infosGroupe.participants;
    let filtered = participants.filter(p => p.id.startsWith(nation.code));

    if (filtered.length === 0) return repondre(`No numbers for ${key.toUpperCase()} found here.`);

    let msg = `╭─────────────━┈⊷\n│ ARYAN TECH ${key.toUpperCase()} ${nation.flag}\n╰─────────────━┈⊷\n\n`;
    filtered.forEach(m => { msg += `${nation.flag} @${m.id.split("@")[0]}\n`; });

    await zk.sendMessage(dest, { text: msg, mentions: filtered.map(i => i.id) }, { quoted: ms });
    await zk.sendMessage(dest, { audio: { url: nation.song }, mimetype: "audio/mp4", ptt: true }, { quoted: ms });
}

// 5. AUTO-REGISTER ALL INDIVIDUAL COMMANDS
Object.keys(nationData).forEach(n => {
    zokou({ nomCom: n, categorie: "Nation-Tags" }, async (dest, zk, opts) => {
        await executeTag(dest, zk, opts, n);
    });
});
