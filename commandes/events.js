"use strict";

const { zokou } = require('../framework/zokou');
const { attribuerUnevaleur } = require('../bdd/welcome');

/**
 * Generic function to create toggle commands for group events
 */
async function createToggleCommand(eventName) {
    zokou({
        nomCom: eventName,
        categorie: 'Group',
        reaction: '⚙️'
    }, async (dest, zk, commandeOptions) => {
        const { ms, arg, repondre, superUser, verifAdmin } = commandeOptions;
        const channelJid = "120363420172397674@newsletter";

        // Check if the user is Admin or Bot Owner
        if (verifAdmin || superUser) {
            if (!arg[0]) {
                return repondre(`*『 ARYAN-TECH 𝙲𝙾𝙽𝙵𝙸𝙶 』*\n\nUsage:\nUse *${eventName} on* to enable.\nUse *${eventName} off* to disable.`);
            }

            const status = arg[0].toLowerCase();

            if (status === 'on' || status === 'off') {
                // Update the value in the database
                await attribuerUnevaleur(dest, eventName, status);
                
                await zk.sendMessage(dest, {
                    text: `✅ *${eventName.toUpperCase()}* has been successfully updated to: *${status}*`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: channelJid,
                            newsletterName: "Aryan-tech 𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂",
                            serverMessageId: 1
                        }
                    }
                }, { quoted: ms });
            } else {
                repondre('❌ Invalid choice. Use *on* to activate or *off* to deactivate.');
            }
        } else {
            repondre('❌ This command is restricted to Group Admins and the Bot Owner.');
        }
    });
}

// Initialize the toggle commands
createToggleCommand('welcome');
createToggleCommand('goodbye');
createToggleCommand('antipromote');
createToggleCommand('antidemote');
