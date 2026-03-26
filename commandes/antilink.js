// commandes/antilink.js
const { verifierEtatJid, recupererActionJid, enregistrerJid, mettreAJourActionJid, supprimerJid } = require("../bdd/antilien");
const { getWarnCountByJID, resetWarnCountByJID } = require("../bdd/warn");

module.exports = {
    nomCom: "antilink",
    reaction: "🔗",
    categorie: "group",
    description: "Kudhibiti anti-link kwenye group",
    permission: "admin",
    fonction: async (origineMessage, zk, options) => {
        const { arg, verifGroupe, repondre, verifAdmin, superUser } = options;
        
        if (!verifGroupe) {
            repondre("❌ Command hii inatumika kwenye group tu!");
            return;
        }
        
        if (!verifAdmin && !superUser) {
            repondre("❌ Command hii ni kwa admin wa group tu!");
            return;
        }
        
        if (!arg[0]) {
            // Kuangalia status
            const etat = await verifierEtatJid(origineMessage);
            const action = await recupererActionJid(origineMessage);
            
            if (!etat) {
                repondre(`🔗 *ANTI-LINK STATUS*\n\nStatus: ❌ OFF\n\nIkiwasha: .antilink on\nKuweka action: .setantilink warn/delete/remove`);
            } else {
                let actionText = "";
                if (action === "warn") actionText = "⚠️ ONYO (3 strikes)";
                else if (action === "delete") actionText = "🗑️ Futa Ujumbe";
                else if (action === "remove") actionText = "🚫 Futa + Mtoe Group";
                
                repondre(`🔗 *ANTI-LINK STATUS*\n\nStatus: ✅ ON\nAction: ${actionText}\n\nKuzima: .antilink off`);
            }
            return;
        }
        
        const cmd = arg[0].toLowerCase();
        
        if (cmd === "on") {
            await enregistrerJid(origineMessage);
            repondre("✅ Anti-link imewashwa kwenye group hili!\n\nPia weka action: .setantilink warn/delete/remove");
        } 
        else if (cmd === "off") {
            await supprimerJid(origineMessage);
            repondre("❌ Anti-link imezimwa kwenye group hili!");
        }
        else {
            repondre("❌ Command sahihi:\n.antilink on - Kuwasha\n.antilink off - Kuzima");
        }
    }
};

// commandes/setantilink.js
module.exports = {
    nomCom: "setantilink",
    reaction: "⚙️",
    categorie: "group",
    description: "Kuweka action ya anti-link",
    permission: "admin",
    fonction: async (origineMessage, zk, options) => {
        const { arg, verifGroupe, repondre, verifAdmin, superUser } = options;
        
        if (!verifGroupe) {
            repondre("❌ Command hii inatumika kwenye group tu!");
            return;
        }
        
        if (!verifAdmin && !superUser) {
            repondre("❌ Command hii ni kwa admin wa group tu!");
            return;
        }
        
        if (!arg[0]) {
            repondre(`⚙️ *SET ANTI-LINK*\n\nActions:\n• warn - Onyo tu (3 strikes)\n• delete - Futa ujumbe\n• remove - Futa + Mtoe group\n• off - Zima kabisa\n\nExample: .setantilink warn`);
            return;
        }
        
        const action = arg[0].toLowerCase();
        
        if (action === "warn" || action === "delete" || action === "remove") {
            await mettreAJourActionJid(origineMessage, action);
            // Hakikisha anti-link imewashwa
            await enregistrerJid(origineMessage);
            
            let msg = "";
            if (action === "warn") msg = "⚠️ Anti-link imewekwa kwenye mode: ONYO\nMtumiaji ataonywa mara 3 kabla ya kufutwa!";
            else if (action === "delete") msg = "🗑️ Anti-link imewekwa kwenye mode: Futa UJUMBE\nLink zitafutwa mara moja!";
            else if (action === "remove") msg = "🚫 Anti-link imewekwa kwenye mode: Futa + MTOE\nMtumiaji atatolewa group mara moja!";
            
            repondre(msg);
        } 
        else if (action === "off") {
            await supprimerJid(origineMessage);
            repondre("❌ Anti-link imezimwa kabisa!");
        }
        else {
            repondre("❌ Action sahihi: warn, delete, remove, off");
        }
    }
};

// commandes/warnlimit.js
module.exports = {
    nomCom: "warnlimit",
    reaction: "⚠️",
    categorie: "group",
    description: "Kuweka idadi ya onyo kabla ya kufutwa",
    permission: "admin",
    fonction: async (origineMessage, zk, options) => {
        const { arg, verifGroupe, repondre, verifAdmin, superUser } = options;
        
        if (!verifGroupe) {
            repondre("❌ Command hii inatumika kwenye group tu!");
            return;
        }
        
        if (!verifAdmin && !superUser) {
            repondre("❌ Command hii ni kwa admin wa group tu!");
            return;
        }
        
        if (!arg[0] || isNaN(arg[0])) {
            repondre(`⚠️ *WARN LIMIT*\n\nWarn limit ya sasa: ${conf.WARN_COUNT || 3}\n\nKubadilisha: .warnlimit [number]\nExample: .warnlimit 5`);
            return;
        }
        
        const limit = parseInt(arg[0]);
        if (limit < 1 || limit > 10) {
            repondre("❌ Warn limit inapaswa kuwa kati ya 1 na 10!");
            return;
        }
        
        // Update config
        conf.WARN_COUNT = limit;
        
        repondre(`✅ Warn limit imebadilishwa kuwa: ${limit}\n\nMtumiaji ataondolewa baada ya ${limit} warnings!`);
    }
};
