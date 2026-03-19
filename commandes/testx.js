"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { zokou } = require("../framework/zokou"); // Changed to Zokou-MD framework
const { conf } = require('../set');

// Configuration Constants
const channelJid = "120363420172397674@newsletter";
const audioUrl = "https://files.catbox.moe/lqx6sp.mp3";
const botLogo = "https://files.catbox.moe/bq7ym6.jpg";

// COMMAND: TIMNASA-TMD
zokou(
    { nomCom: "ARYAN", reaction: "👊", nomFichier: __filename },
    async (dest, zk, commandeOptions) => {
        console.log("TIMNASA-TMD command triggered!");
        
        let message = "Hello! I'm *TIMNASA-TMD✧*\n\n" + 
                      "I'm a WhatsApp Multi-Device Bot powered by *Aryan-tech*.";
        let credit = "\n\nMade By *Timnasa Sir*";
        let finalMsg = message + credit;

        // 1. Send Image with Caption
        await zk.sendMessage(dest, { image: { url: botLogo }, caption: finalMsg });

        // 2. Send the Audio (Voice Note style)
        await zk.sendMessage(dest, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mp4', 
            ptt: true 
        });

        // 3. Send notification to your Channel
        await zk.sendMessage(channelJid, { 
            text: "🔔 *ARYAN-TECH* has been activated by a user!" 
        });
    }
);

// NEW COMMAND: POST TO CHANNEL (Sends custom text to your newsletter)
zokou(
    { nomCom: "p-channel", reaction: "📢", category: "Owner" },
    async (dest, zk, commandOptions) => {
        const { arg, repondre } = commandOptions;

        if (!arg[0]) {
            return repondre("Please provide the text you want to post.\n\nExample: .p-channel Hello everyone!");
        }

        const channelText = arg.join(" ");

        try {
            await zk.sendMessage(channelJid, { text: channelText });
            repondre("✅ Message successfully posted to the **ARYAN-TECH** channel.");
        } catch (error) {
            repondre("❌ Failed to send. Ensure the bot is an Admin in the channel.");
        }
    }
);

// COMMAND: OWNERLOC
zokou(
    { nomCom: "ownerloc", reaction: "😊" },
    async (dest, zk, commandOptions) => {
        const { ms } = commandOptions;

        await zk.sendMessage(dest, { text: 'Oh! Hi there, welcome to Aryan-bot setup.' }, { quoted: ms });

        // Send Location
        await zk.sendMessage(dest, { 
            location: { degreesLatitude: -6.7924, degreesLongitude: 39.2083 } 
        });

        // Send Contact Card (Vcard)
        const vcard = 'BEGIN:VCARD\n' 
                    + 'VERSION:3.0\n' 
                    + 'FN:Timnasa Sir\n' 
                    + 'ORG: ARYAN-TECH;\n' 
                    + 'TEL;type=CELL;type=VOICE;waid=255756469954:+255756469954\n' 
                    + 'END:VCARD';
        
        await zk.sendMessage(dest, { 
            contacts: { 
                displayName: 'aryan Sir', 
                contacts: [{ vcard }] 
            } 
        });

        // List Message
        const sections = [
            {
                title: "CHANNEL TOOLS",
                rows: [
                    { title: "Broadcast Audio", rowId: "bc_audio", description: "Send the default audio to channel" },
                    { title: "Bot Status", rowId: "status", description: "Check if bot is online" }
                ]
            }
        ];

        const listMessage = {
            text: "Welcome to the ARYAN-TECH owner menu",
            footer: "Powered by ÄŖŸÄŅ-ȚËĊȞ",
            title: "OWNER MENU",
            buttonText: "OPEN MENU",
            sections
        };

        await zk.sendMessage(dest, listMessage);
    }
);

console.log("ÄŖŸÄŅ-ȚËĊȞ: Aryan modules loaded successfully!");
