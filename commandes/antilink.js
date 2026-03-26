const { verifierEtatJid, recupererActionJid, mettreAJourActionJid, enregistrerJid, supprimerJid } = require("../bdd/antilien");
const { getWarnCountByJID, resetWarnCountByJID } = require("../bdd/warn");
const conf = require("../set");

module.exports = {
  nomCom: "antilink",
  reaction: "🔰",
  categorie: "group",
  description: "Manage link protection in groups",
  fonction: async (origineMessage, zk, options) => {
    const { arg, repondre, verifGroupe, verifAdmin, superUser, auteurMessage, idBot, ms, msgRepondu, auteurMsgRepondu, prefixe, nomGroupe } = options;
    
    if (!verifGroupe) {
      await repondre("✖ This command only works in groups.");
      return;
    }
    
    try {
      const groupMeta = await zk.groupMetadata(origineMessage);
      const isAdmin = groupMeta.participants.some(p => p.id === auteurMessage && p.admin);
      const isBotAdmin = groupMeta.participants.some(p => p.id === idBot && p.admin);
      
      if (!isAdmin && !superUser) {
        await repondre("🔒 Group administrators only.");
        return;
      }
      
      const action = arg[0]?.toLowerCase();
      const option = arg[1]?.toLowerCase();
      
      // ========== VIEW STATUS ==========
      if (!action || action === "status") {
        const isActive = await verifierEtatJid(origineMessage);
        const currentAction = await recupererActionJid(origineMessage);
        
        let modeLabel = "⚠️ Strike System";
        let modeDetail = `${conf.WARN_COUNT || 3} warnings before removal`;
        
        if (currentAction === "delete") {
          modeLabel = "🗑️ Delete Only";
          modeDetail = "Links are deleted immediately";
        } else if (currentAction === "remove") {
          modeLabel = "🚫 Instant Remove";
          modeDetail = "Users removed on first offense";
        }
        
        const statusIcon = isActive ? "🟢" : "🔴";
        const statusText = isActive ? "ACTIVE" : "INACTIVE";
        
        const reply = `
┌─────────────────────┐
│   🔰 LINK GUARD     │
└─────────────────────┘

${statusIcon} Status: ${statusText}
📌 Group: ${nomGroupe || "N/A"}
⚙️ Mode: ${modeLabel}
📝 ${modeDetail}

🤖 Bot Admin: ${isBotAdmin ? "Yes ✓" : "No ✗"}
⚠️ Warn Limit: ${conf.WARN_COUNT || 3}

▸ ${prefixe}antilink enable     - Turn on protection
▸ ${prefixe}antilink disable    - Turn off protection
▸ ${prefixe}antilink mode warn  - 3 strike system
▸ ${prefixe}antilink mode delete- Delete only
▸ ${prefixe}antilink mode kick  - Remove instantly
▸ ${prefixe}antilink clear @user- Reset user warnings

⚡ ÄŖŸÄŅ-ȚËĊȞ MD`;
        
        await zk.sendMessage(origineMessage, { text: reply }, { quoted: ms });
        return;
      }
      
      // ========== ENABLE ==========
      if (action === "enable" || action === "on" || action === "activate") {
        await enregistrerJid(origineMessage);
        await mettreAJourActionJid(origineMessage, 'warn');
        
        const reply = `
┌─────────────────────┐
│   🔰 LINK GUARD     │
└─────────────────────┘

✓ PROTECTION ENABLED

All links will be monitored.
3 strikes policy activated.

Requirements:
▸ Bot must be admin
▸ Users get 3 warnings
▸ Auto-remove after limit

⚡ ÄŖŸÄŅ-ȚËĊȞ MD`;
        
        await zk.sendMessage(origineMessage, { text: reply }, { quoted: ms });
        return;
      }
      
      // ========== DISABLE ==========
      if (action === "disable" || action === "off" || action === "deactivate") {
        await supprimerJid(origineMessage);
        
        const reply = `
┌─────────────────────┐
│   🔰 LINK GUARD     │
└─────────────────────┘

✗ PROTECTION DISABLED

Links are now allowed in this group.
No restrictions active.

⚡ ÄŖŸÄŅ-ȚËĊȞ MD`;
        
        await zk.sendMessage(origineMessage, { text: reply }, { quoted: ms });
        return;
      }
      
      // ========== CHANGE MODE ==========
      if (action === "mode") {
        if (!option) {
          await repondre(`✖ Specify mode: warn | delete | kick\n\nExample: ${prefixe}antilink mode warn`);
          return;
        }
        
        let dbAction = 'warn';
        let modeDisplay = "3-Strike System";
        let modeDesc = "Users get 3 warnings before removal";
        
        if (option === "delete") {
          dbAction = 'delete';
          modeDisplay = "Delete Only";
          modeDesc = "Links are deleted instantly, no warnings";
        } else if (option === "kick" || option === "remove") {
          dbAction = 'remove';
          modeDisplay = "Instant Kick";
          modeDesc = "Users removed immediately when sending links";
        } else if (option === "warn") {
          dbAction = 'warn';
          modeDisplay = "3-Strike System";
          modeDesc = `Users get ${conf.WARN_COUNT || 3} warnings before removal`;
        } else {
          await repondre(`✖ Invalid mode. Options: warn, delete, kick`);
          return;
        }
        
        await mettreAJourActionJid(origineMessage, dbAction);
        await enregistrerJid(origineMessage);
        
        const reply = `
┌─────────────────────┐
│   🔰 LINK GUARD     │
└─────────────────────┘

✓ MODE UPDATED

Mode: ${modeDisplay}
${modeDesc}

Bot must be admin to take action.

⚡ ÄŖŸÄŅ-ȚËĊȞ MD`;
        
        await zk.sendMessage(origineMessage, { text: reply }, { quoted: ms });
        return;
      }
      
      // ========== CLEAR WARNINGS ==========
      if (action === "clear" || action === "reset") {
        let targetJid = null;
        
        if (msgRepondu && auteurMsgRepondu) {
          targetJid = auteurMsgRepondu;
        } else if (arg[1] && arg[1].includes('@')) {
          targetJid = arg[1].replace('@', '') + '@s.whatsapp.net';
        } else if (arg[1] && /^\d+$/.test(arg[1])) {
          targetJid = arg[1] + '@s.whatsapp.net';
        }
        
        if (!targetJid) {
          await repondre(`✖ Reply to user's message or mention them.\n\nExample: ${prefixe}antilink clear @user`);
          return;
        }
        
        await resetWarnCountByJID(targetJid);
        
        const reply = `✓ Warnings reset for @${targetJid.split('@')[0]}
Current warnings: 0/${conf.WARN_COUNT || 3}`;
        
        await zk.sendMessage(origineMessage, { text: reply, mentions: [targetJid] }, { quoted: ms });
        return;
      }
      
      // ========== UNKNOWN COMMAND ==========
      await repondre(`✖ Unknown command.

Available commands:
▸ ${prefixe}antilink status
▸ ${prefixe}antilink enable
▸ ${prefixe}antilink disable
▸ ${prefixe}antilink mode warn|delete|kick
▸ ${prefixe}antilink clear @user`);
      
    } catch (error) {
      console.error("Anti-link error:", error);
      await repondre(`✖ Error: ${error.message}

Check:
1. Bot is group admin
2. Database connection works
3. Owner number in set.js is correct`);
    }
  }
};
