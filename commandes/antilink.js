const { zokou } = require("../framework/zokou");
const { verifierEtatJid, recupererActionJid, mettreAJourActionJid, enregistrerJid, supprimerJid } = require("../bdd/antilien");
const { resetWarnCountByJID } = require("../bdd/warn");
const conf = require("../set");

zokou({
    nomCom: "antilink",
    categorie: "Group",
    reaction: "🔗"
}, async (dest, zk, commandeOptions) => {
    const { arg, repondre, verifGroupe, verifAdmin, superUser, ms, msgRepondu, auteurMsgRepondu, prefixe } = commandeOptions;

    if (!verifGroupe) {
        return repondre("❌ This command only works in groups.");
    }

    if (!verifAdmin && !superUser) {
        return repondre("🔒 Only group admins can use this command.");
    }

    try {
        const isActive = await verifierEtatJid(dest);
        
        if (!arg || !arg[0]) {
            const currentAction = await recupererActionJid(dest);
            let actionText = currentAction === 'warn' ? '⚠️ Warn (3 strikes)' : 
                            currentAction === 'delete' ? '🗑️ Delete Only' : '🚫 Remove Immediately';
            const status = isActive ? '✅ ACTIVE' : '❌ INACTIVE';
            
            return repondre(`
╭━━━━━━━━━━━━━━━━━━╮
┃   🔗 ANTI-LINK    ┃
╰━━━━━━━━━━━━━━━━━━╯

📊 Status: ${status}
⚙️ Mode: ${actionText}

📌 Commands:
• ${prefixe}antilink on - Activate
• ${prefixe}antilink off - Deactivate
• ${prefixe}antilink mode warn - 3 strikes
• ${prefixe}antilink mode delete - Delete only
• ${prefixe}antilink mode remove - Remove instantly
• ${prefixe}antilink clear @user - Reset warnings

⚡ ÄŖŸÄŅ-ȚËĊȞ MD`);
        }

        const cmd = arg[0].toLowerCase();

        if (cmd === "on" || cmd === "activate") {
            if (isActive) return repondre("⚠️ Anti-link is already active.");
            await enregistrerJid(dest);
            return repondre("✅ Anti-link activated!");
        }

        if (cmd === "off" || cmd === "deactivate") {
            if (!isActive) return repondre("⚠️ Anti-link is not active.");
            await supprimerJid(dest);
            return repondre("❌ Anti-link deactivated.");
        }

        if (cmd === "mode") {
            const mode = arg[1]?.toLowerCase();
            if (!mode || !['warn', 'delete', 'remove'].includes(mode)) {
                return repondre(`⚠️ Modes: warn, delete, remove\nExample: ${prefixe}antilink mode warn`);
            }
            await mettreAJourActionJid(dest, mode);
            return repondre(`✅ Mode updated to: ${mode}`);
        }

        if (cmd === "clear" || cmd === "reset") {
            let targetJid = null;
            if (msgRepondu && auteurMsgRepondu) targetJid = auteurMsgRepondu;
            else if (arg[1] && arg[1].includes('@')) targetJid = arg[1].replace('@', '') + '@s.whatsapp.net';
            else if (arg[1] && /^\d+$/.test(arg[1])) targetJid = arg[1] + '@s.whatsapp.net';
            
            if (!targetJid) return repondre(`⚠️ Reply or mention user.\nExample: ${prefixe}antilink clear @user`);
            
            await resetWarnCountByJID(targetJid);
            return zk.sendMessage(dest, { text: `✅ Warnings reset for @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: ms });
        }

        return repondre(`❌ Unknown command. Use ${prefixe}antilink for help.`);
    } catch (error) {
        console.error("Anti-link error:", error);
        return repondre(`❌ Error: ${error.message}`);
    }
});
