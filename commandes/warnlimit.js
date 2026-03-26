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
            const warnlimit = global.WARN_COUNT || 3;
            repondre(`⚠️ *WARN LIMIT*\n\nWarn limit ya sasa: ${warnlimit}\n\nKubadilisha: .warnlimit [number]\nExample: .warnlimit 5`);
            return;
        }
        
        const limit = parseInt(arg[0]);
        if (limit < 1 || limit > 10) {
            repondre("❌ Warn limit inapaswa kuwa kati ya 1 na 10!");
            return;
        }
        
        global.WARN_COUNT = limit;
        repondre(`✅ Warn limit imebadilishwa kuwa: ${limit}\n\nMtumiaji ataondolewa baada ya ${limit} warnings!`);
    }
};
