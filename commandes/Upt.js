const { zokou } = require("../framework/zokou");

zokou({
    nomCom: "uptime",
    categorie: "General",
    reaction: "⏱️"
}, async (dest, zk, commandeOptions) => {
    const { repondre, superUser } = commandeOptions;

    // Calculate uptime
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    let uptimeString = "";
    if (days > 0) uptimeString += `${days}d `;
    if (hours > 0) uptimeString += `${hours}h `;
    if (minutes > 0) uptimeString += `${minutes}m `;
    uptimeString += `${seconds}s`;

    const botNumber = zk.user.id.split(':')[0];
    const startTime = new Date(Date.now() - uptimeSeconds * 1000).toLocaleTimeString();

    // Memory stats (using process memory)
    const totalMem = 1.9; // Approximate or you can use os module
    const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024 / 1024).toFixed(1);
    const memPercent = Math.floor((usedMem / totalMem) * 100);
    
    // Create memory bar
    const barLength = 10;
    const filled = Math.floor((usedMem / totalMem) * barLength);
    const memBar = "█".repeat(filled) + "░".repeat(barLength - filled);

    let message = `┌─────────────────┐
│   ⏱️ BOT STATUS   │
└─────────────────┘

🕐 Uptime: ${uptimeString}
📅 Started: ${startTime}

💾 Memory: ${memBar} ${memPercent}%
   ${usedMem}GB / ${totalMem}GB

🤖 Bot: +${botNumber}
⚡ Node: ${process.version}

⚡ ÄŖŸÄŅ-ȚËĊȞ MD`;

    await repondre(message);
});
