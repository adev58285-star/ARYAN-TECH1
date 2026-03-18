const { zokou } = require("../framework/zokou");
const { verifierEtatJid, recupererActionJid, mettreAJourAction, ajouterOuMettreAJourJid } = require("../bdd/antilien");
const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount, resetWarnCountByJID } = require("../bdd/warn");

zokou({
  nomCom: "antilink",
  aliases: ["antilien", "antiurl", "antilinks"],
  reaction: "🔗",
  categorie: "Group"
}, async (dest, zk, commandeOptions) => {
  const { ms, repondre, arg, auteurMessage, idBot } = commandeOptions;
  
  // Check if in group
  if (!dest.endsWith("@g.us")) {
    return repondre("❌ This command only works in groups.");
  }
  
  try {
    // Get group metadata
    const groupMetadata = await zk.groupMetadata(dest);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(p => p.id === auteurMessage && (p.admin === 'admin' || p.admin === 'superadmin'));
    const isBotAdmin = participants.some(p => p.id === idBot && (p.admin === 'admin' || p.admin === 'superadmin'));
    
    // Check if user is admin
    if (!isAdmin) {
      return repondre("❌ Only group admins can use this command.");
    }
    
    // Check if bot is admin
    if (!isBotAdmin) {
      return repondre("❌ Bot must be admin to delete messages.");
    }
    
    const subCommand = arg[0]?.toLowerCase();
    
    // ============ TURN ON ANTI-LINK ============
    if (subCommand === "on") {
      await ajouterOuMettreAJourJid(dest, 'oui');
      // Set default action to warn (3 strikes)
      await mettreAJourAction(dest, 'warn');
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *ANTI-LINK SYSTEM* 〕━━━╮
┃
┃ 🔗 *ANTI-LINK ACTIVATED*
┃
┃ ✅ Links will be monitored
┃
┃ ⚙️ *3-STRIKE RULE:* 
┃ └─ 1st & 2nd: Warning
┃ └─ 3rd: Remove from group
┃
┃ 📝 *Commands available:*
┃ └─ .antilink action [delete/warn/remove]
┃ └─ .antilink reset @user
┃
╰━━━〔 *POWERED BY RAHMANI* 〕━━━╯

⚡ *ÄŖŸÄŅ-ȚËĊȞ*`,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363420172397674@newsletter",
            newsletterName: "ÄŖŸÄŅ Protection System",
            serverMessageId: 143
          },
          externalAdReply: {
            title: "ÄŖŸÄŅ-ȚËĊȞ",
            body: "🔗 3-Strike Anti-Link",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png",
            mediaType: 1
          }
        }
      }, { quoted: ms });
    }
    
    // ============ TURN OFF ANTI-LINK ============
    else if (subCommand === "off") {
      await ajouterOuMettreAJourJid(dest, 'non');
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *ANTI-LINK SYSTEM* 〕━━━╮
┃
┃ 🔗 *ANTI-LINK DEACTIVATED*
┃
┃ ❌ Links will no longer be monitored.
┃
╰━━━〔 *POWERED BY RAHMAN* 〕━━━╯

⚡ *ÄŖŸÄŅ-ȚËĊȞ*`,
        contextInfo: {
          externalAdReply: {
            title: "ÄŖŸÄŅ-ȚËĊȞ",
            body: "🔗 Anti-Link Deactivated",
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
    }
    
    // ============ SET ACTION (delete/warn/remove) ============
    else if (subCommand === "action") {
      const action = arg[1]?.toLowerCase();
      
      let dbAction = 'warn'; // default
      let actionDisplay = '3-strike rule';
      
      if (action === 'delete') {
        dbAction = 'delete';
        actionDisplay = 'delete only (no warnings)';
      } else if (action === 'warn') {
        dbAction = 'warn';
        actionDisplay = '3-strike rule (warn + remove)';
      } else if (action === 'remove' || action === 'kick') {
        dbAction = 'remove';
        actionDisplay = 'remove immediately';
      } else {
        return repondre("❌ Please specify action: `delete`, `warn`, or `remove`\nExample: `.antilink action warn`");
      }
      
      await mettreAJourAction(dest, dbAction);
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *ANTI-LINK SYSTEM* 〕━━━╮
┃
┃ 🔗 *ACTION UPDATED*
┃
┃ ✅ Anti-link action set to: *${actionDisplay}*
┃
╰━━━〔 *POWERED BY RAHMAN* 〕━━━╯

⚡ *ÄŖŸÄŅ-ȚËĊȞ*`,
        contextInfo: {
          externalAdReply: {
            title: "ÄŖŸÄŅ-ȚËĊȞ",
            body: `Action: ${actionDisplay}`,
            thumbnailUrl: "https://files.catbox.moe/2yarwr.png"
          }
        }
      }, { quoted: ms });
    }
    
    // ============ RESET WARNINGS FOR USER ============
    else if (subCommand === "reset") {
      let targetJid = null;
      
      // Check if replying to someone
      if (commandeOptions.msgRepondu && commandeOptions.auteurMsgRepondu) {
        targetJid = commandeOptions.auteurMsgRepondu;
      } else if (arg[1] && arg[1].includes('@')) {
        targetJid = arg[1].replace('@', '') + '@s.whatsapp.net';
      } else {
        return repondre("❌ Please reply to a user or mention them to reset warnings.\nExample: `.antilink reset @user`");
      }
      
      await resetWarnCountByJID(targetJid);
      
      return zk.sendMessage(dest, {
        text: `✅ *Warnings reset for* @${targetJid.split('@')[0]}`,
        mentions: [targetJid]
      }, { quoted: ms });
    }
    
    // ============ CHECK USER WARNINGS ============
    else if (subCommand === "check") {
      let targetJid = null;
      
      if (commandeOptions.msgRepondu && commandeOptions.auteurMsgRepondu) {
        targetJid = commandeOptions.auteurMsgRepondu;
      } else if (arg[1] && arg[1].includes('@')) {
        targetJid = arg[1].replace('@', '') + '@s.whatsapp.net';
      } else {
        targetJid = auteurMessage; // Check self
      }
      
      const warnCount = await getWarnCountByJID(targetJid) || 0;
      const warnLimit = conf.WARN_COUNT || 3;
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *WARN CHECK* 〕━━━╮
┃
┃ 👤 *User:* @${targetJid.split('@')[0]}
┃ 📊 *Warnings:* ${warnCount}/${warnLimit}
┃
╰━━━〔 *POWERED BY RAHMAN* 〕━━━╯

⚡ *ÄŖŸÄŅ-ȚËĊȞ*`,
        mentions: [targetJid]
      }, { quoted: ms });
    }
    
    // ============ SHOW CURRENT SETTINGS ============
    else {
      const etat = await verifierEtatJid(dest);
      const dbAction = await recupererActionJid(dest) || 'warn';
      
      // Translate action for display
      let actionDisplay = '3-strike rule';
      if (dbAction === 'delete') actionDisplay = 'delete only';
      else if (dbAction === 'remove') actionDisplay = 'remove immediately';
      
      const statusText = etat ? "✅ *ON*" : "❌ *OFF*";
      
      return zk.sendMessage(dest, {
        text: `╭━━━〔 *ANTI-LINK SETTINGS* 〕━━━╮
┃
┃ 📊 *Status:* ${statusText}
┃ ⚙️ *Action:* ${actionDisplay}
┃
┃ 📝 *Available Commands:*
┃ └─ .antilink on              - Enable
┃ └─ .antilink off             - Disable
┃ └─ .antilink action [delete|warn|remove]
┃ └─ .antilink reset @user     - Reset warnings
┃ └─ .antilink check @user     - Check warnings
┃
┃ ⚠️ *Bot must be admin*
┃
╰━━━〔 *POWERED BY ÄŖŸÄŅ* 〕━━━╯

⚡ *ÄŖŸÄŅ-ȚËĊȞ*`
      }, { quoted: ms });
    }
    
  } catch (error) {
    console.error("Anti-link command error:", error);
    repondre("❌ Error: " + error.message);
  }
});
