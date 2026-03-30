const express = require("express");
const { EventEmitter } = require("events");

const authEvents = new EventEmitter();
let clients = [];
let currentQR = null;
let isConnected = false;
let httpServer = null;

function broadcast(data) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(r => { try { r.write(msg); } catch(e) {} });
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ÄŖŸÄŅ-ȚËĊȞ — Connect</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:32px;max-width:440px;width:100%;text-align:center}
  h1{font-size:1.5rem;margin-bottom:4px;color:#58a6ff}
  .sub{color:#8b949e;font-size:.85rem;margin-bottom:24px}
  .tabs{display:flex;border-bottom:1px solid #30363d;margin-bottom:24px}
  .tab{flex:1;padding:10px;cursor:pointer;color:#8b949e;font-size:.88rem;border:none;background:none;border-bottom:2px solid transparent;transition:.15s}
  .tab.active{color:#58a6ff;border-bottom-color:#58a6ff}
  .section{display:none}.section.active{display:block}
  canvas{border-radius:8px;background:#fff;padding:8px;margin:0 auto 10px;display:block}
  .hint{color:#8b949e;font-size:.8rem;margin-top:8px;line-height:1.5}
  input,textarea{width:100%;padding:10px 14px;background:#0d1117;border:1px solid #30363d;border-radius:8px;color:#e6edf3;font-size:.92rem;margin-bottom:12px;outline:none;font-family:inherit}
  input:focus,textarea:focus{border-color:#58a6ff}
  textarea{resize:vertical;min-height:80px}
  .btn{width:100%;padding:11px;background:#238636;border:none;border-radius:8px;color:#fff;font-size:.92rem;cursor:pointer;font-weight:600;transition:.15s}
  .btn:hover{background:#2ea043}.btn:disabled{background:#21262d;color:#484f58;cursor:not-allowed}
  .btn-sec{background:#21262d;margin-top:8px}.btn-sec:hover{background:#30363d}
  .code-box{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:18px;font-size:2.2rem;font-weight:700;letter-spacing:.3em;color:#58a6ff;margin:14px 0}
  .status{margin-top:10px;font-size:.82rem;color:#8b949e;min-height:18px}
  .spinner{display:inline-block;width:16px;height:16px;border:2px solid #30363d;border-top-color:#58a6ff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:5px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .connected{color:#3fb950;font-size:1.2rem;font-weight:700;margin-top:8px}
</style>
</head>
<body>
<div class="card">
  <h1>ÄŖŸÄŅ-ȚËĊȞ</h1>
  <p class="sub">Connect your WhatsApp account to start the bot</p>

  <div id="connected-view" style="display:none">
    <div class="connected">✅ WhatsApp Connected!</div>
    <p class="hint" style="margin-top:12px">The bot is online and running. You can close this page.</p>
  </div>

  <div id="auth-view">
    <div class="tabs">
      <button class="tab active" onclick="switchTab('qr')">📷 Scan QR</button>
      <button class="tab" onclick="switchTab('pair')">📱 Phone Number</button>
      <button class="tab" onclick="switchTab('session')">🔑 Session ID</button>
    </div>

    <div id="tab-qr" class="section active">
      <canvas id="qr-canvas" width="220" height="220"></canvas>
      <p class="hint"><span class="spinner"></span>Open WhatsApp &rarr; Linked Devices &rarr; Link a Device &rarr; Scan QR</p>
      <p class="status" id="qr-status">Generating QR code...</p>
    </div>

    <div id="tab-pair" class="section">
      <p class="hint" style="margin-bottom:14px;text-align:left">Enter your WhatsApp number with country code, no + sign:</p>
      <input type="tel" id="phone-input" placeholder="e.g. 254101150748">
      <button class="btn" id="pair-btn" onclick="requestPair()">Get Pairing Code</button>
      <div id="pair-result" style="display:none">
        <div class="code-box" id="pair-code-display">--------</div>
        <p class="hint">In WhatsApp: Linked Devices &rarr; Link a Device &rarr; "Link with phone number" &rarr; enter this code</p>
        <button class="btn btn-sec" onclick="requestPair()">↺ Request New Code</button>
      </div>
      <p class="status" id="pair-status"></p>
    </div>

    <div id="tab-session" class="section">
      <p class="hint" style="margin-bottom:14px;text-align:left">Paste your Session ID (from a Baileys session generator):</p>
      <textarea id="session-input" placeholder="Paste session ID here..."></textarea>
      <button class="btn" onclick="submitSession()">Connect with Session ID</button>
      <p class="status" id="session-status"></p>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
<script>
function switchTab(name) {
  ['qr','pair','session'].forEach((n,i) => {
    document.querySelectorAll('.tab')[i].classList.toggle('active', n===name);
    document.getElementById('tab-'+n).classList.toggle('active', n===name);
  });
}

const es = new EventSource('/events');
es.onmessage = e => {
  const d = JSON.parse(e.data);
  if (d.type === 'qr') {
    document.getElementById('qr-status').textContent = 'QR ready — scan it quickly!';
    QRCode.toCanvas(document.getElementById('qr-canvas'), d.data, {width:220,margin:1}, ()=>{});
  } else if (d.type === 'connected') {
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('connected-view').style.display = 'block';
    es.close();
  }
};

async function requestPair() {
  const phone = (document.getElementById('phone-input').value||'').replace(/[^0-9]/g,'');
  if (!phone || phone.length < 7) { document.getElementById('pair-status').textContent = '⚠ Enter a valid phone number first.'; return; }
  document.getElementById('pair-btn').disabled = true;
  document.getElementById('pair-status').textContent = 'Requesting code from WhatsApp...';
  document.getElementById('pair-result').style.display = 'none';
  try {
    const r = await fetch('/pair', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
    const d = await r.json();
    if (d.code) {
      document.getElementById('pair-code-display').textContent = d.code;
      document.getElementById('pair-result').style.display = 'block';
      document.getElementById('pair-status').textContent = '⏳ Enter the code in WhatsApp within 60 seconds';
    } else {
      document.getElementById('pair-status').textContent = '❌ ' + (d.error || 'Failed to get code');
    }
  } catch(e) { document.getElementById('pair-status').textContent = '❌ Request failed, try again.'; }
  document.getElementById('pair-btn').disabled = false;
}

async function submitSession() {
  const sid = (document.getElementById('session-input').value||'').trim();
  if (!sid) { document.getElementById('session-status').textContent = '⚠ Paste a session ID first.'; return; }
  document.getElementById('session-status').textContent = 'Saving and reconnecting...';
  try {
    const r = await fetch('/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:sid})});
    const d = await r.json();
    document.getElementById('session-status').textContent = d.ok ? '✅ Saved! Bot is reconnecting...' : '❌ ' + (d.error||'Unknown error');
  } catch(e) { document.getElementById('session-status').textContent = '❌ Failed. Try again.'; }
}
</script>
</body>
</html>`;

function startAuthServer(port = 5000) {
    const app = express();
    app.use(express.json());

    app.get("/", (req, res) => res.send(HTML));

    app.get("/events", (req, res) => {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();
        clients.push(res);
        if (currentQR) res.write(`data: ${JSON.stringify({ type: "qr", data: currentQR })}\n\n`);
        if (isConnected) res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
        req.on("close", () => { clients = clients.filter(c => c !== res); });
    });

    app.post("/pair", (req, res) => {
        const phone = (req.body.phone || "").replace(/[^0-9]/g, "");
        if (!phone) return res.json({ error: "Phone number required" });
        authEvents.emit("pair-request", phone, res);
    });

    app.post("/session", (req, res) => {
        const session = (req.body.session || "").trim();
        if (!session) return res.json({ error: "Session required" });
        authEvents.emit("session-submit", session, res);
    });

    httpServer = app.listen(port, "0.0.0.0", () => {
        console.log(`\n🌐 Auth page ready — open the Replit Preview tab to connect WhatsApp\n`);
    });

    return httpServer;
}

function sendQR(qrData) {
    currentQR = qrData;
    broadcast({ type: "qr", data: qrData });
}

function sendConnected() {
    isConnected = true;
    currentQR = null;
    broadcast({ type: "connected" });
    setTimeout(() => { try { if (httpServer) httpServer.close(); } catch(e) {} }, 5000);
}

function stopAuthServer() {
    try { if (httpServer) httpServer.close(); } catch(e) {}
}

module.exports = { startAuthServer, sendQR, sendConnected, stopAuthServer, authEvents };
