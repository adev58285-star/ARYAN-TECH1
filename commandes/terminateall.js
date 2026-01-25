"use strict";

const { zokou } = require("../framework/zokou");

/**
 * TERMINATE ALL COMMAND (PURGE PROTOCOL)
 * Process: Demote all admins -> 2s Delay -> Remove all members.
 * Authorization: Bot Owner (255784766591) or Group Creator.
 */

zokou({
  nomCom: "terminateall",
  aliases: ["killall", "wipe", "purge"], 
  categorie: 'VIP_command',
  reaction: "💀"
}, async (dest, zk, commandeOptions) => {
  const { auteurMessage, ms, repondre, verifGroupe, superUser } = commandeOptions;

  // 1. Check if the command is used in a group
  if (!verifGroupe) {
    return repondre("✋🏿 This command is restricted to groups only ❌");
  }

  try {
    const metadata = await zk.groupMetadata(dest);
    const botNumber = zk.user.id.split(":")[0] + "@s.whatsapp.net";
    const channelJid = "120363420172397674@newsletter";
    const audioUrl = "https://files.catbox.moe/lqx6sp.mp3";
    const ownerNumber = "255637518095";

    // 2. Security: Only Bot Owner or Group Creator can execute
    if (superUser || auteurMessage === metadata.owner) {
      
      repondre('☣️ *𝚃𝙴𝚁𝙼𝙸𝙽𝙰𝚃𝙴-𝙰𝙻𝙻 𝚂𝚈𝚂𝚃𝙴𝙼 𝙰𝙲𝚃𝙸𝚅𝙰𝚃𝙴𝙳* ☣️\n_Initiating Demote + Purge Protocol..._');
      
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // 3. Group Lockdown
      await zk.groupSettingUpdate(dest, "announcement"); // Mute group
      await zk.groupUpdateSubject(dest, "ARYAN 𝙳𝙴𝙰𝚃𝙷 𝚉𝙾𝙽𝙴");
      await zk.groupRevokeInvite(dest); // Reset invite link

      const participants = metadata.participants;
      
      // Filter Admins to demote (Excluding Bot and Creator)
      const adminsToDemote = participants.filter(m => 
        m.admin && m.id !== botNumber && m.id !== metadata.owner
      ).map(u => u.id);

      // Filter Members to remove (Everyone except Bot and Creator)
      const usersToRemove = participants.filter(m => 
        m.id !== botNumber && m.id !== metadata.owner
      ).map(u => u.id);

      if (usersToRemove.length === 0) {
        return repondre("ℹ️ No eligible targets found to purge.");
      }

      // 4. STEP 1: DEMOTE ALL ADMINS
      if (adminsToDemote.length > 0) {
        await zk.sendMessage(dest, { text: `\`\`\`[PHASE 1]: Stripping privileges from ${adminsToDemote.length} Admins...\`\`\`` });
        await zk.groupParticipantsUpdate(dest, adminsToDemote, "demote");
      }

      // 5. PHASE DELAY (2 SECONDS)
      await delay(2000);

      // 6. STEP 2: TOTAL PURGE
      await zk.sendMessage(dest, {
        text: `\`\`\`[PHASE 2]: Eliminating ${usersToRemove.length} members from the zone...\`\`\``,
        mentions: usersToRemove,
      }, { quoted: ms });

      await zk.groupParticipantsUpdate(dest, usersToRemove, "remove");

      // 7. FINAL AUDIO & BRANDING
      await zk.sendMessage(dest, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: true,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: channelJid,
                newsletterName: `ARYAN 𝚂𝚈𝚂𝚃𝙴𝙼",
                serverMessageId: 1
            },
            externalAdReply: {
                title: "𝚃𝙴𝚁𝙼𝙸𝙽𝙰𝚃𝙸𝙾𝙽 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻",
                body: "All targets have been purged.",
                thumbnailUrl: "https://files.catbox.moe/e51g2r.jpg",
                sourceUrl: `https://wa.me/${ownerNumber}`,
                mediaType: 1
            }
        }
      });

    } else {
      repondre("⛔ *ACCESS DENIED:* Only the Bot Owner or Group Creator can trigger this protocol.");
    }
  } catch (e) {
    console.error("Purge Error:", e);
    repondre("❌ *CRITICAL ERROR:* I need full Admin rights to execute this protocol.");
  }
});
