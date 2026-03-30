const { zokou } = require("../framework/zokou");

// ============================================================
// RESTART COMMAND
// Sends a confirmation message then exits cleanly.
// Replit's workflow manager will auto-restart the process.
// Session is NOT cleared — the bot reconnects with existing creds.
// ============================================================
zokou({
    nomCom: "restart",
    aliases: ["reboot", "update", "reload"],
    categorie: "Owner",
    reaction: "🔄"
}, async (dest, zk, commandeOptions) => {
    const { superUser, repondre } = commandeOptions;

    if (!superUser) {
        repondre("❌ This command is for the bot owner only.");
        return;
    }

    try {
        await zk.sendMessage(dest, {
            text: "🔄 *Restarting ÄŖŸÄŅ-ȚËĊȞ...*\n\nThe bot will be back online in a few seconds. Session is preserved — no re-login needed."
        });
    } catch (e) {}

    // Short delay so the message is delivered before exit
    setTimeout(() => {
        console.log("🔄 [RESTART] Graceful restart triggered by owner command.");
        process.exit(0);
    }, 2000);
});
