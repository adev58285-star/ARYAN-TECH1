const { verifierEtatJid, recupererActionJid, enregistrerJid, supprimerJid } = require("../bdd/antilien");

module.exports = {
    nomCom: "antilink",
    reaction: "🔗",
    categorie: "group",
    description: "Kuangalia status ya anti-link",
    permission: "user",
    fonction: async (origineMessage, zk, options) => {
        const { arg, verifGroupe, repondre } = options;
        
        if (!verifGroupe) {
            repondre("❌ Command hii inatumika kwenye group tu!");
            return;
        }
        
        const etat = await verifierEtatJid(origineMessage);
        const action = await recupererActionJid(origineMessage);
        
        if (!etat) {
            repondre(`🔗 *ANTI-LINK STATUS*\n\nStatus: ❌ OFF\n\nKuwasha: .setantilink warn/delete/remove`);
        } else {
            let actionText = "";
            if (action === "warn") actionText = "⚠️ ONYO (3 strikes)";
            else if (action === "delete") actionText = "🗑️ Futa Ujumbe";
            else if (action === "remove") actionText = "🚫 Futa + Mtoe Group";
            
            repondre(`🔗 *ANTI-LINK STATUS*\n\nStatus: ✅ ON\nAction: ${actionText}\n\nKuzima: .setantilink off`);
        }
    }
};
