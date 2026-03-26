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
        
        // No arguments - show help
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
• ${prefixe}antilink on - Activate protection
• ${prefixe}antilink off - Deactivate protection
• ${prefixe}antilink mode warn - 3 strikes system
• ${prefixe}antilink mode delete - Delete only
• ${prefixe}antilink mode remove - Remove instantly
• ${prefixe}antilink clear @user - Reset warnings

⚡ ÄŖŸÄŅ-ȚËĊȞ MD`);
        }

        const cmd = arg[0].toLowerCase();

        // ========== ENABLE ==========
        if (cmd === "on" || cmd === "activate") {
            if (isActive) {
                return repondre("⚠️ Anti-link is already active in this group.");
            }
            await enregistrerJid(dest);
            await mettreAJourActionJid(dest, 'warn');
            return repondre("✅ Anti-link has been activated successfully!\n\n⚠️ Users will receive 3 warnings before removal.");
        }

        // ========== DISABLE ==========
        if (cmd === "off" || cmd === "deactivate") {
            if (!isActive) {
                return repondre("⚠️ Anti-link is not active in this group.");
            }
            await supprimerJid(dest);
            return repondre("❌ Anti-link has been deactivated successfully.\n\nLinks are now allowed in this group.");
        }

        // ========== CHANGE MODE ==========
        if (cmd === "mode") {
            const mode = arg[1]?.toLowerCase();
            
            if (!mode || (mode !== 'warn' && mode !== 'delete' && mode !== 'remove')) {
                return repondre(`
⚠️ Available modes:
• warn - 3 strikes system (default)
• delete - Delete links only
• remove - Delete + remove user

Example: ${prefixe}antilink mode warn`);
            }
            
            await mettreAJourActionJid(dest, mode);
            
            let modeMsg = mode === 'warn' ? '⚠️ 3 strikes system' : 
                         mode === 'delete' ? '🗑️ Delete only' : '🚫 Remove instantly';
            
            return repondre(`✅ Anti-link mode updated to: ${modeMsg}\n\nMake sure bot is admin to take action.`);
        }

        // ========== CLEAR WARNINGS ==========
        if (cmd === "clear" || cmd === "reset") {
            let targetJid = null;
            
            // Check if replying to a message
            if (msgRepondu && auteurMsgRepondu) {
                targetJid = auteurMsgRepondu;
            }
            // Check if mentioning someone
            else if (arg[1] && arg[1].includes('@')) {
                targetJid = arg[1].replace('@', '') + '@s.whatsapp.net';
            }
            // Check if it's a number
            else if (arg[1] && /^\d+$/.test(arg[1])) {
                targetJid = arg[1] + '@s.whatsapp.net';
            }
            
            if (!targetJid) {
                return repondre(`⚠️ Please reply to a user's message or mention them.\n\nExample: ${prefixe}antilink clear @user`);
            }
            
            await resetWarnCountByJID(targetJid);
            return zk.sendMessage(dest, { 
                text: `✅ Warnings reset for @${targetJid.split('@')[0]}\n\nThey now have 0/${conf.WARN_COUNT || 3} warnings.`,
                mentions: [targetJid]
            }, { quoted: ms });
        }

        // Unknown command
        return repondre(`
❌ Unknown command.

Available commands:
• ${prefixe}antilink on
• ${prefixe}antilink off
• ${prefixe}antilink mode warn/delete/remove
• ${prefixe}antilink clear @user`);
        
    } catch (error) {
        console.error("Anti-link error:", error);
        return repondre(`❌ Error: ${error.message}\n\nCheck that bot is admin and database is working.`);
    }
});
