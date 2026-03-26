const os = require('os');

module.exports = {
  nomCom: "uptime",
  reaction: "⏱️",
  categorie: "general",
  description: "Check bot uptime and system stats",
  fonction: async (origineMessage, zk, options) => {
    const { repondre, superUser } = options;
    
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
    
    // Memory stats
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
    const usedMem = (totalMem - freeMem).toFixed(1);
    const memPercent = ((usedMem / totalMem) * 100).toFixed(0);
    
    // Create memory bar
    const barLength = 10;
    const filled = Math.floor((usedMem / totalMem) * barLength);
    const memBar = "█".repeat(filled) + "░".repeat(barLength - filled);
    
    // Bot info
    const botNumber = zk.user.id.split(':')[0];
    const startTime = new Date(Date.now() - uptimeSeconds * 1000).toLocaleTimeString();
    
    let message = `┌─────────────────┐
│   ⏱️ BOT STATUS   │
└─────────────────┘

🕐 Uptime: ${uptimeString}
📅 Started: ${startTime}

💾 Memory: ${memBar} ${memPercent}%
   ${usedMem}GB / ${totalMem}GB

🤖 Bot: +${botNumber}
⚡ Node: ${process.version.slice(1)}`;

    // Extra info for superUser
    if (superUser) {
      const cpuLoad = os.loadavg()[0].toFixed(1);
      message += `

🔧 System:
   CPU: ${cpuLoad}%
   Platform: ${os.platform()}
   PID: ${process.pid}`;
    }
    
    message += `

⚡ ÄŖŸÄŅ-ȚËĊȞ MD`;
    
    await repondre(message);
  }
};
