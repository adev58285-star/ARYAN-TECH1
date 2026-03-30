const express = require("express");
const { EventEmitter } = require("events");

const authEvents = new EventEmitter();
authEvents.setMaxListeners(20);

let clients = [];
let isConnected = false;
let httpServer = null;

function broadcast(data) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(r => { try { r.write(msg); } catch (e) {} });
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ÄŖŸÄŅ-ȚËĊȞ — Connect</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:#161b22;border:1px solid #30363d;border-radius:14px;padding:32px;max-width:460px;width:100%;text-align:center}
h1{font-size:1.5rem;color:#58a6ff;margin-bottom:4px}
.sub{color:#8b949e;font-size:.85rem;margin-bottom:28px}
.tabs{display:flex;border-bottom:1px solid #30363d;margin-bottom:24px}
.tab{flex:1;padding:10px 6px;cursor:pointer;color:#8b949e;font-size:.85rem;border:none;background:none;border-bottom:2px solid transparent;transition:.15s}
.tab.active{color:#58a6ff;border-bottom-color:#58a6ff}
.section{display:none}.section.active{display:block}
input,textarea{width:100%;padding:11px 14px;background:#0d1117;border:1px solid #30363d;border-radius:8px;color:#e6edf3;font-size:.95rem;margin-bottom:12px;outline:none;font-family:inherit}
input:focus,textarea:focus{border-color:#58a6ff}
textarea{resize:vertical;min-height:80px}
.btn{width:100%;padding:12px;background:#1f6feb;border:none;border-radius:8px;color:#fff;font-size:.95rem;cursor:pointer;font-weight:600;transition:.15s}
.btn:hover{background:#388bfd}.btn:disabled{background:#21262d;color:#484f58;cursor:not-allowed}
.status{margin-top:10px;font-size:.82rem;color:#8b949e;min-height:18px;line-height:1.5}
.err{color:#f85149}.ok{color:#3fb950}

/* ─── Pairing code display ─── */
.code-wrap{display:none;margin:20px 0}
.code-label{font-size:.78rem;color:#8b949e;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.code-box{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}
.code-char{width:46px;height:56px;background:#0d1117;border:2px solid #1f6feb;border-radius:8px;font-size:1.6rem;font-weight:700;color:#58a6ff;display:flex;align-items:center;justify-content:center;letter-spacing:0}
.timer-bar-wrap{background:#21262d;border-radius:4px;height:6px;overflow:hidden;margin-bottom:8px}
.timer-bar{height:6px;background:#1f6feb;border-radius:4px;transition:width 1s linear}
.timer-txt{font-size:.78rem;color:#8b949e;margin-bottom:14px}
.steps{text-align:left;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:14px 16px;font-size:.83rem;line-height:2}
.steps li{list-style:none;padding-left:0}
.steps li::before{margin-right:8px}
.steps b{color:#e6edf3}

/* ─── Connected ─── */
.connected{color:#3fb950;font-size:1.2rem;font-weight:700;margin:8px 0}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid #30363d;border-top-color:#58a6ff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:5px}
@keyframes spin{to{transform:rotate(360deg)}}
canvas{border-radius:8px;background:#fff;padding:6px;margin:0 auto 10px;display:block}
.qr-hint{color:#8b949e;font-size:.8rem;margin-top:6px;line-height:1.5}
</style>
</head>
<body>
<div class="card">
  <h1>ÄŖŸÄŅ-ȚËĊȞ</h1>
  <p class="sub">Connect your WhatsApp to start the bot</p>

  <div id="connected-view" style="display:none">
    <div class="connected">✅ WhatsApp Connected!</div>
    <p class="status ok" style="margin-top:10px">Bot is now online. You can close this page.</p>
  </div>

  <div id="auth-view">
    <div class="tabs">
      <button class="tab active" onclick="switchTab('pair')">📱 Phone Number</button>
      <button class="tab" onclick="switchTab('qr')">📷 QR Code</button>
      <button class="tab" onclick="switchTab('session')">🔑 Session ID</button>
    </div>

    <!-- ── PHONE NUMBER / PAIRING CODE ── -->
    <div id="tab-pair" class="section active">
      <p class="status" style="margin-bottom:12px;text-align:left">Enter your WhatsApp number (country code, no +):</p>
      <input type="tel" id="phone-input" placeholder="e.g. 254700123456" inputmode="numeric">
      <button class="btn" id="pair-btn" onclick="requestPair()">Get Pairing Code</button>
      <p class="status" id="pair-status"></p>

      <!-- Code display shown after code arrives via SSE -->
      <div class="code-wrap" id="code-wrap">
        <div class="code-label">Your WhatsApp Pairing Code</div>
        <div class="code-box" id="code-box"></div>
        <div class="timer-bar-wrap"><div class="timer-bar" id="timer-bar" style="width:100%"></div></div>
        <div class="timer-txt" id="timer-txt">60 seconds remaining</div>
        <ul class="steps">
          <li>1. Open <b>WhatsApp</b> on your phone</li>
          <li>2. Tap the <b>⋮ menu</b> (top right) → <b>Linked Devices</b></li>
          <li>3. Tap <b>"Link a Device"</b></li>
          <li>4. On the QR screen, tap <b>"Link with phone number"</b></li>
          <li>5. Type the <b>8-character code</b> above exactly as shown</li>
        </ul>
        <button class="btn" id="new-code-btn" onclick="requestPair()" style="margin-top:14px;background:#21262d">↺ Request New Code</button>
      </div>
    </div>

    <!-- ── QR CODE ── -->
    <div id="tab-qr" class="section">
      <canvas id="qr-canvas" width="220" height="220"></canvas>
      <p class="qr-hint"><span class="spinner"></span>Open WhatsApp → Linked Devices → Link a Device → Scan QR</p>
      <p class="status" id="qr-status">Waiting for QR code...</p>
    </div>

    <!-- ── SESSION ID ── -->
    <div id="tab-session" class="section">
      <p class="status" style="margin-bottom:10px;text-align:left">Paste your Baileys Session ID:</p>
      <textarea id="session-input" placeholder="Paste session ID here..."></textarea>
      <button class="btn" onclick="submitSession()">Connect with Session ID</button>
      <p class="status" id="session-status"></p>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
<script>
let timerInterval = null;
let timerSecs = 60;

function switchTab(name) {
  ['pair','qr','session'].forEach((n,i) => {
    document.querySelectorAll('.tab')[i].classList.toggle('active', n===name);
    document.getElementById('tab-'+n).classList.toggle('active', n===name);
  });
}

function startTimer(secs) {
  clearInterval(timerInterval);
  timerSecs = secs || 60;
  const bar = document.getElementById('timer-bar');
  const txt = document.getElementById('timer-txt');
  const total = timerSecs;
  timerInterval = setInterval(() => {
    timerSecs--;
    const pct = Math.max(0, (timerSecs / total) * 100);
    bar.style.width = pct + '%';
    bar.style.background = pct > 40 ? '#1f6feb' : pct > 15 ? '#e3b341' : '#f85149';
    txt.textContent = timerSecs > 0 ? timerSecs + ' seconds remaining — enter it in WhatsApp now!' : 'Code expired — request a new one';
    if (timerSecs <= 0) clearInterval(timerInterval);
  }, 1000);
}

function showCode(code) {
  const box = document.getElementById('code-box');
  box.innerHTML = '';
  code.split('').forEach(ch => {
    const d = document.createElement('div');
    d.className = 'code-char';
    d.textContent = ch;
    box.appendChild(d);
  });
  document.getElementById('code-wrap').style.display = 'block';
  document.getElementById('pair-status').textContent = '';
  startTimer(60);
}

const es = new EventSource('/events');
es.onmessage = e => {
  const d = JSON.parse(e.data);
  if (d.type === 'qr') {
    document.getElementById('qr-status').textContent = 'QR ready — scan it quickly!';
    QRCode.toCanvas(document.getElementById('qr-canvas'), d.data, {width:220,margin:1}, ()=>{});
  } else if (d.type === 'pair-code') {
    switchTab('pair');
    showCode(d.code);
    document.getElementById('pair-btn').disabled = false;
  } else if (d.type === 'pair-error') {
    document.getElementById('pair-status').textContent = '❌ ' + d.message;
    document.getElementById('pair-btn').disabled = false;
  } else if (d.type === 'connected') {
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('connected-view').style.display = 'block';
    clearInterval(timerInterval);
    es.close();
  }
};
es.onerror = () => {};

async function requestPair() {
  const phone = (document.getElementById('phone-input').value || '').replace(/[^0-9]/g,'');
  if (!phone || phone.length < 7) {
    document.getElementById('pair-status').textContent = '⚠ Enter a valid WhatsApp number first.';
    return;
  }
  document.getElementById('pair-btn').disabled = true;
  document.getElementById('pair-status').textContent = '⏳ Connecting to WhatsApp and requesting code...';
  document.getElementById('code-wrap').style.display = 'none';
  clearInterval(timerInterval);
  try {
    const r = await fetch('/pair', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
    const d = await r.json();
    if (d.accepted) {
      document.getElementById('pair-status').textContent = '⏳ Code is being generated — it will appear here in a few seconds...';
    } else {
      document.getElementById('pair-status').textContent = '❌ ' + (d.error || 'Failed');
      document.getElementById('pair-btn').disabled = false;
    }
  } catch(e) {
    document.getElementById('pair-status').textContent = '❌ Request failed. Try again.';
    document.getElementById('pair-btn').disabled = false;
  }
}

async function submitSession() {
  const sid = (document.getElementById('session-input').value || '').trim();
  if (!sid) { document.getElementById('session-status').textContent = '⚠ Paste a session ID first.'; return; }
  document.getElementById('session-status').textContent = 'Saving...';
  try {
    const r = await fetch('/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:sid})});
    const d = await r.json();
    document.getElementById('session-status').textContent = d.ok ? '✅ Saved! Bot reconnecting...' : '❌ ' + (d.error||'Unknown error');
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
        if (isConnected) res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
        req.on("close", () => { clients = clients.filter(c => c !== res); });
    });

    // Pair request — reply immediately with "accepted", code arrives via SSE
    app.post("/pair", (req, res) => {
        const phone = (req.body.phone || "").replace(/[^0-9]/g, "");
        if (!phone || phone.length < 7) return res.json({ error: "Enter a valid phone number" });
        authEvents.emit("pair-request", phone, res);
    });

    app.post("/session", (req, res) => {
        const session = (req.body.session || "").trim();
        if (!session) return res.json({ error: "Session required" });
        authEvents.emit("session-submit", session, res);
    });

    httpServer = app.listen(port, "0.0.0.0", () => {
        console.log(`\n🌐 Auth page running — open the Replit Preview tab to connect WhatsApp\n`);
    });

    return httpServer;
}

// Called by index.js when Baileys emits a new QR string
function sendQR(qrData) {
    broadcast({ type: "qr", data: qrData });
}

// Called by index.js when a pairing code is successfully obtained
function sendPairCode(code) {
    broadcast({ type: "pair-code", code });
}

// Called by index.js when pairing code request fails
function sendPairError(message) {
    broadcast({ type: "pair-error", message });
}

// Called by index.js when WhatsApp connection is open
function sendConnected() {
    isConnected = true;
    broadcast({ type: "connected" });
    setTimeout(() => { try { if (httpServer) httpServer.close(); } catch (e) {} }, 5000);
}

function stopAuthServer() {
    try { if (httpServer) httpServer.close(); } catch (e) {}
}

module.exports = { startAuthServer, sendQR, sendPairCode, sendPairError, sendConnected, stopAuthServer, authEvents };
