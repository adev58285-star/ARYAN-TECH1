const { verifierEtatJid, recupererActionJid } = require("../bdd/antilien");

module.exports = {
  nomCom: "antilink",
  reaction: "🔗",
  categorie: "group",
  description: "Kuangalia status ya anti-link",
  usage: ".antilink",
  permission: "user",
  fonction: async (origineMessage, zk, options) => {
    const { verifGroupe, repondre } = options;
    
    if (!verifGroupe) {
      await repondre("❌ Command hii inatumika kwenye group tu!");
      return;
    }
    
    try {
      const etat = await verifierEtatJid(origineMessage);
      const action = await recupererActionJid(origineMessage);
      
      if (!etat) {
        await repondre(`🔗 *ANTI-LINK STATUS*\n\nStatus: ❌ OFF\n\nKuwasha: .setantilink warn/delete/remove`);
      } else {
        let actionText = "";
        if (action === "warn") actionText = "⚠️ ONYO (3 strikes)";
        else if (action === "delete") actionText = "🗑️ Futa Ujumbe";
        else if (action === "remove") actionText = "🚫 Futa + Mtoe Group";
        
        await repondre(`🔗 *ANTI-LINK STATUS*\n\nStatus: ✅ ON\nAction: ${actionText}\n\nKuzima: .setantilink off`);
      }
    } catch (error) {
      console.log("Antilink error:", error);
      await repondre("❌ Error checking anti-link status");
    }
  }
};
