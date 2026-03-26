const { verifierEtatJid, recupererActionJid, enregistrerJid, mettreAJourActionJid, supprimerJid } = require("../bdd/antilien");

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
            await enregistrerJid(origineMessage);
            
            let msg = "";
            if (action === "warn") msg = "⚠️ Anti-link imewekwa kwenye mode: ONYO\nMtumiaji ataonywa mara 3 kabla ya kufutwa!";
            else if (action === "delete") msg = "🗑️ Anti-link imewekwa kwenye mode: Futa UJUMBE\nLink zitafutwa mara moja!";
            else if (action === "remove") msg = "🚫 Anti-link imewekwa kwenye mode: Futa + MTOE\nMtumiaji atatolewa group mara moja!";
            
            repondre(msg);
        } else if (action === "off") {
            await supprimerJid(origineMessage);
            repondre("❌ Anti-link imezimwa kabisa!");
        } else {
            repondre("❌ Action sahihi: warn, delete, remove, off");
        }
    }
};
