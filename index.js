"use strict";

// ============================================================
// PROCESS-LEVEL STABILITY GUARDS — must be first
// Prevents crashes from unhandled promise rejections or errors
// ============================================================
process.on("uncaughtException", (err) => {
    console.error("[FATAL] uncaughtException:", err.message || err);
});
process.on("unhandledRejection", (reason) => {
    console.error("[FATAL] unhandledRejection:", reason?.message || reason);
});

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function(mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const logger = logger_1.default.child({});
logger.level = 'silent';
const pino = require("pino");
require("events").EventEmitter.defaultMaxListeners = 50;
const boom_1 = require("@hapi/boom");
const conf = require("./set");
const axios = require("axios");
let fs = require("fs-extra");
let path = require("path");
const FileType = require('file-type');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const { verifierEtatJid, recupererActionJid, mettreAJourActionJid, enregistrerJid, supprimerJid } = require("./bdd/antilien");
const { atbverifierEtatJid, atbrecupererActionJid } = require("./bdd/antibot");
let evt = require(__dirname + "/framework/zokou");
const { isUserBanned, addUserToBanList, removeUserFromBanList } = require("./bdd/banUser");
const { addGroupToBanList, isGroupBanned, removeGroupFromBanList } = require("./bdd/banGroup");
const { isGroupOnlyAdmin, addGroupToOnlyAdminList, removeGroupFromOnlyAdminList } = require("./bdd/onlyAdmin");
const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount, resetWarnCountByJID } = require("./bdd/warn");
let { reagir } = require(__dirname + "/framework/app");
var session = conf.session.replace(/TIMNASA-MD;;;=>/g, "");
const prefixe = conf.PREFIXE;
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// ============================================================
// CONSOLE AUTH — readline-based, no web server needed
// ============================================================
const readline = require("readline");

function ask(prompt) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans.trim()); }));
}

// ============================================================
// AUTH STATE — shared across reconnects
// ============================================================
let usePairingCode = false;
let pairingPhoneNumber = "";
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60_000;
let heartbeatTimer = null;
let activeSocket = null;

// ============================================================
// CHECK if creds.json is a fully registered (paired) session
// ============================================================
function hasValidSession() {
    const p = __dirname + "/auth/creds.json";
    if (!fs.existsSync(p)) return false;
    try {
        const d = JSON.parse(fs.readFileSync(p, "utf8"));
        // noiseKey is always present in any real Baileys session,
        // regardless of whether 'registered' has been set yet.
        return d && d.noiseKey != null;
    } catch { return false; }
}

function clearAuthDir() {
    try { fs.emptyDirSync(__dirname + "/auth"); } catch (e) {}
    console.log("[AUTH] Credentials cleared.");
}

// ============================================================
// AUTHENTICATION — runs at startup and after loggedOut.
// Uses console readline — no web server required.
// ============================================================
async function authentification() {
    await fs.ensureDir(__dirname + "/auth");

    // 1. SESSION_ID from env / set.js → write and go
    if (session && session !== "zokk") {
        console.log("[AUTH] Using SESSION_ID from config...");
        await fs.writeFile(
            __dirname + "/auth/creds.json",
            Buffer.from(session, "base64").toString("utf-8"),
            "utf8"
        );
        return;
    }

    // 2. Saved session on disk → try it. Let WhatsApp reject (401)
    //    if it's truly invalid — don't preemptively clear it.
    if (hasValidSession()) {
        console.log("[AUTH] Saved session found — reconnecting...");
        return;
    }

    // 3. No usable creds at all → show auth menu
    clearAuthDir();
    await fs.ensureDir(__dirname + "/auth");

    // 4. Interactive console menu
    console.log("\n╔═════════════════════════════════════════════╗");
    console.log("║       ÄŖŸÄŅ-ȚËĊȞ  —  Authentication        ║");
    console.log("╠═════════════════════════════════════════════╣");
    console.log("║  1 — Paste Session ID (instant)             ║");
    console.log("║  2 — Link with phone number (pairing code)  ║");
    console.log("║  3 — Link with QR code (scan in WhatsApp)   ║");
    console.log("╚═════════════════════════════════════════════╝\n");

    let choice;
    try { choice = await ask("  Enter choice (1 / 2 / 3): "); }
    catch { choice = "3"; } // fallback if stdin unavailable

    if (choice === "1") {
        // ── Session ID ──────────────────────────────────────────
        const raw = await ask("  Paste Session ID: ");
        const cleaned = raw.replace(/^TIMNASA-MD;;;=>/g, "").trim();
        try {
            const decoded = Buffer.from(cleaned, "base64").toString("utf-8");
            JSON.parse(decoded); // ensure valid JSON
            await fs.writeFile(__dirname + "/auth/creds.json", decoded, "utf8");
            console.log("\n[AUTH] Session ID saved — connecting...\n");
        } catch {
            console.log("\n[AUTH] ❌ Invalid session ID. Try again.\n");
            return authentification();
        }

    } else if (choice === "2") {
        // ── Pairing code ────────────────────────────────────────
        const raw = await ask("  Enter your WhatsApp number (country code, no +):\n  Example: 254700123456\n  > ");
        pairingPhoneNumber = raw.replace(/[^0-9]/g, "");
        if (pairingPhoneNumber.length < 7) {
            console.log("\n[AUTH] ❌ Invalid number. Try again.\n");
            return authentification();
        }
        usePairingCode = true;
        console.log(`\n[AUTH] Pairing mode set for +${pairingPhoneNumber}`);
        console.log("[AUTH] Connecting — your code will appear shortly...\n");

    } else {
        // ── QR code (option 3 or any other input) ───────────────
        usePairingCode = false;
        console.log("\n[AUTH] QR mode — a QR code will print in this console.");
        console.log("[AUTH] Open WhatsApp → Linked Devices → Link a Device → Scan QR\n");
    }
}
const groupMetadataCache = {};
const GROUP_CACHE_TTL = 5 * 60 * 1000;

async function getGroupMetadata(zk, groupId) {
    const now = Date.now();
    const cached = groupMetadataCache[groupId];
    if (cached && (now - cached.timestamp) < GROUP_CACHE_TTL) {
        return cached.data;
    }
    try {
        const metadata = await zk.groupMetadata(groupId);
        groupMetadataCache[groupId] = { data: metadata, timestamp: now };
        return metadata;
    } catch (e) {
        return cached ? cached.data : null;
    }
}

const store = (0, baileys_1.makeInMemoryStore)({
    logger: pino().child({ level: "silent", stream: "store" }),
});

// ============================================================
// RECONNECT DELAY — exponential backoff, capped at 60s
// ============================================================
function getReconnectDelay() {
    const delay = Math.min(5000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
    reconnectAttempts++;
    return delay;
}

// ============================================================
// HEARTBEAT — keep WebSocket alive during idle periods
// ============================================================
function startHeartbeat(zk) {
    stopHeartbeat();
    heartbeatTimer = setInterval(async () => {
        try {
            if (zk && zk.user) {
                await zk.sendPresenceUpdate("available");
            }
        } catch (e) { /* ignore — reconnect logic handles real failures */ }
    }, 25_000); // every 25 seconds
}

function stopHeartbeat() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

// ============================================================
// MAIN BOT STARTUP — call after auth, re-called on disconnect
// ============================================================
async function startBot() {
    const { version } = await (0, baileys_1.fetchLatestBaileysVersion)();
    const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(__dirname + "/auth");

    const sockOptions = {
        version,
        logger: pino({ level: "silent" }),
        browser: baileys_1.Browsers.ubuntu("Chrome"),
        // Always false — we manually handle QR display and pairing code
        // in connection.update so both modes use the same code path.
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false,
        keepAliveIntervalMs: 15_000,
        auth: {
            creds: state.creds,
            keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
        },
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
                return msg?.message || undefined;
            }
            return { conversation: "An Error Occurred, Repeat Command!" };
        },
    };

    const zk = (0, baileys_1.default)(sockOptions);
    activeSocket = zk;
    store.bind(zk.ev);

    // ----------------------------------------------------------
    // PAIRING CODE — requested inside connection.update when the
    // first QR update fires. At that point the full Noise protocol
    // handshake is complete and WhatsApp is ready to accept either
    // a QR scan OR a pair-device IQ. Calling it earlier (before
    // the handshake) causes "Connection Closed" / 401 every time.
    // ----------------------------------------------------------
    let pairCodeRequested = false;

        if (conf.AUTOREACT_STATUS === "yes") {
            zk.ev.on("messages.upsert", async (m) => {
                const { messages } = m;
                for (const message of messages) {
                    if (message.key && message.key.remoteJid === "status@broadcast") {
                        try {
                            const reactionEmojis = ["❤️", "🔥", "👍", "😂", "😮", "😢", "🤔", "👏", "🎉", "🤩"];
                            const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
                            await zk.readMessages([message.key]);
                            await new Promise(resolve => setTimeout(resolve, 500));
                            await zk.sendMessage(message.key.remoteJid, {
                                react: {
                                    text: randomEmoji,
                                    key: message.key
                                }
                            });
                            console.log(`Reacted to status from ${message.key.participant} with ${randomEmoji}`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        } catch (error) {
                            console.error("Status reaction failed:", error);
                        }
                    }
                }
            });
        }

        zk.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            const ms = messages[0];
            if (!ms.message) return;

            const decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    let decode = (0, baileys_1.jidDecode)(jid) || {};
                    return decode.user && decode.server && decode.user + '@' + decode.server || jid;
                } else return jid;
            };

            var mtype = (0, baileys_1.getContentType)(ms.message);
            var texte = mtype == "conversation" ? ms.message.conversation :
                mtype == "imageMessage" ? ms.message.imageMessage?.caption :
                mtype == "videoMessage" ? ms.message.videoMessage?.caption :
                mtype == "extendedTextMessage" ? ms.message?.extendedTextMessage?.text :
                mtype == "buttonsResponseMessage" ? ms?.message?.buttonsResponseMessage?.selectedButtonId :
                mtype == "listResponseMessage" ? ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId :
                mtype == "messageContextInfo" ? (ms?.message?.buttonsResponseMessage?.selectedButtonId || ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text) : "";
            
            var origineMessage = ms.key.remoteJid;
            var idBot = decodeJid(zk.user.id);
            var servBot = idBot.split('@')[0];
            
            const verifGroupe = origineMessage?.endsWith("@g.us");
            var infosGroupe = verifGroupe ? await zk.groupMetadata(origineMessage) : "";
            var nomGroupe = verifGroupe ? infosGroupe.subject : "";
            var msgRepondu = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
            var auteurMsgRepondu = decodeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
            
            var mr = ms.Message?.extendedTextMessage?.contextInfo?.mentionedJid;
            var utilisateur = mr ? mr : msgRepondu ? auteurMsgRepondu : "";
            var auteurMessage = verifGroupe ? (ms.key.participant ? ms.key.participant : ms.participant) : origineMessage;
            if (ms.key.fromMe) {
                auteurMessage = idBot;
            }

            console.log("------ contenu du message ------");
            console.log(texte);

            var membreGroupe = verifGroupe ? ms.key.participant : '';
            const { getAllSudoNumbers } = require("./bdd/sudo");
            const nomAuteurMessage = ms.pushName;
            const dj = '255784766591';
            const dj2 = '255784766591';
            const dj3 = "255784766591";
            const luffy = '255784766591';
            const sudo = await getAllSudoNumbers();
            const superUserNumbers = [servBot, dj, dj2, dj3, luffy, conf.NUMERO_OWNER].map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net");
            const allAllowedNumbers = superUserNumbers.concat(sudo);
            const superUser = allAllowedNumbers.includes(auteurMessage);
            
            var dev = [dj, dj2, dj3, luffy].map((t) => t.replace(/[^0-9]/g) + "@s.whatsapp.net").includes(auteurMessage);
            
            function repondre(mes) {
                zk.sendMessage(origineMessage, { text: mes }, { quoted: ms });
            }
            
            console.log("\nÄŖŸÄŅ-ȚËĊȞ2 is ONLINE");
            console.log("=========== written message===========");
            if (verifGroupe) {
                console.log("message provenant du groupe : " + nomGroupe);
            }
            console.log("message envoyé par : " + "[" + nomAuteurMessage + " : " + auteurMessage.split("@s.whatsapp.net")[0] + " ]");
            console.log("type de message : " + mtype);
            console.log("------ contenu du message ------");
            console.log(texte);

            // ================== CHATBOT ==================
            if (conf.CHATBOT === "on" && !ms.key.fromMe) {
                const query = texte.toLowerCase().trim();
                const senderJid = ms.key.participant || ms.key.remoteJid;
                const senderTag = `@${senderJid.split('@')[0]}`;

                const textTriggers = [
                    "hi", "hello", "mambo", "niaje", "habari", "mambo vipi", "shwari", "oy", "oiee",
                    "mambo?", "poa", "safi", "mzima", "hujambo", "habari yako", "mshkaji", "vipi",
                    "mambo yanakuwaje", "uko sawa", "niambie", "semo", "bro", "kiongozi", "admin",
                    "bot", "timnasa", "mambo bot", "ujumbe", "nisaidie", "msaada", "karibu", "asanteni",
                    "thanks", "thank you", "asante", "shukrani", "pamoja", "tuko pamoja", "uko wapi",
                    "uko online", "mbona kimya", "nicheki", "nipigie", "unajua nini", "mimi hapa",
                    "nani yuko hapo", "upo?", "habari za mchana", "habari za asubuhi", "habari za jioni"
                ];

                if (textTriggers.includes(query)) {
                    let responses = [
                        `Safi sana ${senderTag}, mzima? Karibu! 🤖`,
                        `kaka ${senderTag}! Unahitaji nini kiongozi?`,
                        `Salama kabisa ${senderTag}, natumai u mzima wa afya.`,
                        `Karibu sana ${senderTag}, furaha yangu ni kukusaidia! 🙏`,
                        `mkuu ${senderTag}, sema lolote nipo kwa ajili yako.`
                    ];
                    let randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    await zk.sendPresenceUpdate('composing', origineMessage);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await zk.sendMessage(origineMessage, { text: randomResponse, mentions: [senderJid] }, { quoted: ms });
                }

                const audioTriggers = [
                    "cheka", "hahaha", "haha", "😂", "🤣", "vichekesho", "niambie kitu", "nichekeshe",
                    "sound", "sauti", "audio", "nitumie", "oyee", "oyee!", "shangilia", "shangwe",
                    "piga kelele", "fanya vurugu", "vurugu", "sherehe", "happy", "furaha", "cheza",
                    "ngoma", "mziki", "hit", "fire", "moto", "🔥🔥", "balaa", "noma", "hatari",
                    "fungua", "sikiliza", "test", "jaribu", "fanya", "anza", "piga", "rekodi",
                    "sauti gani", "nini hii", "sikia", "mambo gani", "mambo vipi sauti", "mzuka",
                    "amsha", "amsha amsha", "changamka", "changamsha", "timoth"
                ];

                if (audioTriggers.includes(query)) {
                    const audioUrl = "https://files.catbox.moe/de6scq.MP3";
                    await zk.sendPresenceUpdate('recording', origineMessage);
                    await new Promise(resolve => setTimeout(resolve, 3500));
                    await zk.sendMessage(origineMessage, {
                        audio: { url: audioUrl },
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, { quoted: ms });
                }
            }

            // ================== ANTI-DELETE ==================
            const { getAntiDeleteSettings } = require("./bdd/antidelete");
            zk.ev.on('messages.update', async (chatUpdate) => {
                for (const { key, update } of chatUpdate) {
                    if (update.protocolMessage && update.protocolMessage.type === 0) {
                        if (conf.ANTIDELETE !== "yes") return;
                        try {
                            const oldMsg = await store.loadMessage(key.remoteJid, update.protocolMessage.key.id);
                            if (!oldMsg) return;
                            const myNumber = zk.user.id.split(':')[0] + '@s.whatsapp.net';
                            const sender = update.protocolMessage.key.participant || update.protocolMessage.key.remoteJid;
                            const isGroup = key.remoteJid.endsWith('@g.us');
                            const destination = (conf.ANTIDELETE_DEST === "group") ? key.remoteJid : myNumber;
                            let report = `*🚨 ANTI-DELETE DETECTED 🚨*\n\n`;
                            report += `👤 *Sender:* @${sender.split('@')[0]}\n`;
                            report += `📍 *Location:* ${isGroup ? "Group Chat" : "Private Chat"}\n`;
                            if (isGroup) {
                                const metadata = await zk.groupMetadata(key.remoteJid);
                                report += `🏘️ *Group Name:* ${metadata.subject}\n`;
                            }
                            report += `📅 *Time:* ${new Date().toLocaleString()}\n\n`;
                            report += `⚠️ *Restored Content below:*`;
                            await zk.sendMessage(destination, { text: report, mentions: [sender] });
                            await zk.copyNForward(destination, oldMsg, true);
                        } catch (err) {
                            console.log("Anti-delete Error: " + err);
                        }
                    }
                }
            });

            // ================== STATUS MENTIONS PROTECTION ==================
            if (conf.STATUS_MENTIONS === "on" && ms.message && !ms.key.fromMe) {
                const isGroup = origineMessage.endsWith('@g.us');
                const contextInfo = ms.message?.extendedTextMessage?.contextInfo ||
                    ms.message?.imageMessage?.contextInfo ||
                    ms.message?.videoMessage?.contextInfo;
                const hasHiddenMentions = contextInfo?.mentionedJid?.length > 0;
                const isStatusType = ms.message?.statusMentionMessage || ms.message?.protocolMessage?.type === 3;
                if (isGroup && (isStatusType || hasHiddenMentions)) {
                    const botNumber = zk.user.id.split(':')[0] + '@s.whatsapp.net';
                    const groupMetadata = await zk.groupMetadata(origineMessage);
                    const groupAdmins = groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id);
                    const isBotAdmin = groupAdmins.includes(botNumber);
                    const isSenderAdmin = groupAdmins.includes(ms.key.participant);
                    if (isBotAdmin && !isSenderAdmin) {
                        await zk.sendMessage(origineMessage, { delete: ms.key });
                        await zk.sendMessage(origineMessage, {
                            text: `🚫 *SECURITY ALERT* 🚫\n\n@${ms.key.participant.split('@')[0]} has been kicked for using Hidden Mentions.`,
                            mentions: [ms.key.participant]
                        });
                        setTimeout(async () => {
                            await zk.groupParticipantsUpdate(origineMessage, [ms.key.participant], "remove");
                        }, 1500);
                    }
                }
            }

            // ================== ANTI-STICKER ==================
            if (conf.ANTISTICKER === "on" && ms.message?.stickerMessage && !ms.key.fromMe) {
                const isGroup = origineMessage.endsWith('@g.us');
                if (isGroup) {
                    const botNumber = zk.user.id.split(':')[0] + '@s.whatsapp.net';
                    const groupMetadata = await zk.groupMetadata(origineMessage);
                    const groupAdmins = groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id);
                    const isBotAdmin = groupAdmins.includes(botNumber);
                    const isSenderAdmin = groupAdmins.includes(ms.key.participant);
                    if (isBotAdmin && !isSenderAdmin) {
                        await zk.sendMessage(origineMessage, { delete: ms.key });
                        await zk.sendMessage(origineMessage, {
                            text: `⚠️ *ANTI-STICKER* ⚠️\n\n@${ms.key.participant.split('@')[0]}, stickers are prohibited in this group.`,
                            mentions: [ms.key.participant]
                        });
                    }
                }
            }

            function groupeAdmin(membreGroupe) {
                let admin = [];
                for (let m of membreGroupe) {
                    if (m.admin == null) continue;
                    admin.push(m.id);
                }
                return admin;
            }

            var etat = conf.ETAT;
            if (etat == 1) {
                await zk.sendPresenceUpdate("available", origineMessage);
            } else if (etat == 2) {
                await zk.sendPresenceUpdate("composing", origineMessage);
            } else if (etat == 3) {
                await zk.sendPresenceUpdate("recording", origineMessage);
            } else {
                await zk.sendPresenceUpdate("unavailable", origineMessage);
            }

            const mbre = verifGroupe ? await infosGroupe.participants : '';
            let admins = verifGroupe ? groupeAdmin(mbre) : '';
            const verifAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
            var verifZokouAdmin = verifGroupe ? admins.includes(idBot) : false;

            const arg = texte ? texte.trim().split(/ +/).slice(1) : null;
            const verifCom = texte ? texte.startsWith(prefixe) : false;
            const com = verifCom ? texte.slice(1).trim().split(/ +/).shift().toLowerCase() : false;

            const lien = conf.URL.split(',');

            function mybotpic() {
                const indiceAleatoire = Math.floor(Math.random() * lien.length);
                const lienAleatoire = lien[indiceAleatoire];
                return lienAleatoire;
            }

            var commandeOptions = {
                superUser, dev,
                verifGroupe,
                mbre,
                membreGroupe,
                verifAdmin,
                infosGroupe,
                nomGroupe,
                auteurMessage,
                nomAuteurMessage,
                idBot,
                verifZokouAdmin,
                prefixe,
                arg,
                repondre,
                mtype,
                groupeAdmin,
                msgRepondu,
                auteurMsgRepondu,
                ms,
                mybotpic
            };

            if (ms.message.protocolMessage && ms.message.protocolMessage.type === 0 && (conf.ADM).toLocaleLowerCase() === 'yes') {
                if (ms.key.fromMe || ms.message.protocolMessage.key.fromMe) {
                    console.log('Message supprimer me concernant');
                    return;
                }
                console.log(`Message supprimer`);
                let key = ms.message.protocolMessage.key;
                try {
                    let st = './store.json';
                    const data = fs.readFileSync(st, 'utf8');
                    const jsonData = JSON.parse(data);
                    let message = jsonData.messages[key.remoteJid];
                    let msg;
                    for (let i = 0; i < message.length; i++) {
                        if (message[i].key.id === key.id) {
                            msg = message[i];
                            break;
                        }
                    }
                    if (msg === null || !msg || msg === 'undefined') {
                        console.log('Message non trouver');
                        return;
                    }
                    await zk.sendMessage(idBot, { image: { url: './media/deleted-message.jpg' }, caption: `😎Anti-delete-message🥵\n Message from @${msg.key.participant.split('@')[0]}​`, mentions: [msg.key.participant] },)
                        .then(() => {
                            zk.sendMessage(idBot, { forward: msg }, { quoted: msg });
                        });
                } catch (e) {
                    console.log(e);
                }
            }

            if (ms.key && ms.key.remoteJid === "status@broadcast" && conf.AUTO_READ_STATUS === "yes") {
                await zk.readMessages([ms.key]);
            }
            if (ms.key && ms.key.remoteJid === 'status@broadcast' && conf.AUTO_DOWNLOAD_STATUS === "yes") {
                if (ms.message.extendedTextMessage) {
                    var stTxt = ms.message.extendedTextMessage.text;
                    await zk.sendMessage(idBot, { text: stTxt }, { quoted: ms });
                } else if (ms.message.imageMessage) {
                    var stMsg = ms.message.imageMessage.caption;
                    var stImg = await zk.downloadAndSaveMediaMessage(ms.message.imageMessage);
                    await zk.sendMessage(idBot, { image: { url: stImg }, caption: stMsg }, { quoted: ms });
                } else if (ms.message.videoMessage) {
                    var stMsg = ms.message.videoMessage.caption;
                    var stVideo = await zk.downloadAndSaveMediaMessage(ms.message.videoMessage);
                    await zk.sendMessage(idBot, {
                        video: { url: stVideo }, caption: stMsg
                    }, { quoted: ms });
                }
            }
            if (!dev && origineMessage == "120363158701337904@g.us") {
                return;
            }

            if (texte && auteurMessage.endsWith("s.whatsapp.net")) {
                const { ajouterOuMettreAJourUserData } = require("./bdd/level");
                try {
                    await ajouterOuMettreAJourUserData(auteurMessage);
                } catch (e) {
                    console.error(e);
                }
            }

            try {
                if (ms.message[mtype].contextInfo.mentionedJid && (ms.message[mtype].contextInfo.mentionedJid.includes(idBot) || ms.message[mtype].contextInfo.mentionedJid.includes(conf.NUMERO_OWNER + '@s.whatsapp.net'))) {
                    if (origineMessage == "120363158701337904@g.us") {
                        return;
                    };
                    if (superUser) {
                        console.log('hummm');
                        return;
                    }
                    let mbd = require('./bdd/mention');
                    let alldata = await mbd.recupererToutesLesValeurs();
                    let data = alldata[0];
                    if (data.status === 'non') {
                        console.log('mention pas actifs');
                        return;
                    }
                    let msg;
                    if (data.type.toLocaleLowerCase() === 'image') {
                        msg = {
                            image: { url: data.url },
                            caption: data.message
                        };
                    } else if (data.type.toLocaleLowerCase() === 'video') {
                        msg = {
                            video: { url: data.url },
                            caption: data.message
                        };
                    } else if (data.type.toLocaleLowerCase() === 'sticker') {
                        let stickerMess = new Sticker(data.url, {
                            pack: conf.NOM_OWNER,
                            type: StickerTypes.FULL,
                            categories: ["🤩", "🎉"],
                            id: "12345",
                            quality: 70,
                            background: "transparent",
                        });
                        const stickerBuffer2 = await stickerMess.toBuffer();
                        msg = {
                            sticker: stickerBuffer2
                        };
                    } else if (data.type.toLocaleLowerCase() === 'audio') {
                        msg = {
                            audio: { url: data.url },
                            mimetype: 'audio/mp4',
                        };
                    }
                    zk.sendMessage(origineMessage, msg, { quoted: ms });
                }
            } catch (error) {}

            // ============ COMMANDS ============
            if (verifCom) {
                const cd = evt.cm.find((zokou) => zokou.nomCom === (com));
                if (cd) {
                    try {
                        if ((conf.MODE).toLocaleLowerCase() != 'yes' && !superUser) {
                            repondre("Bot iko private mode!");
                            return;
                        }
                        if (!superUser && origineMessage === auteurMessage && conf.PM_PERMIT === "yes") {
                            repondre("You don't have access to commands here");
                            return;
                        }
                        if (!superUser && verifGroupe) {
                            let req = await isGroupBanned(origineMessage);
                            if (req) return;
                        }
                        if (!verifAdmin && verifGroupe) {
                            let req = await isGroupOnlyAdmin(origineMessage);
                            if (req) return;
                        }
                        if (!superUser) {
                            let req = await isUserBanned(auteurMessage);
                            if (req) {
                                repondre("You are banned from bot commands");
                                return;
                            }
                        }
                        reagir(origineMessage, zk, ms, cd.reaction);
                        cd.fonction(origineMessage, zk, commandeOptions);
                    } catch (e) {
                        console.log("Command error: " + e);
                        zk.sendMessage(origineMessage, { text: "❌ Error: " + e }, { quoted: ms });
                    }
                }
            }

            // ============= ANTI-LINK HANDLER (FULLY FIXED WITH MESSAGES) =============
            try {
                const isAntiLinkEnabled = await verifierEtatJid(origineMessage);
                
                // Simple link detection
                let hasLink = false;
                if (texte) {
                    hasLink = texte.includes("http") || texte.includes("www.");
                }
                
                if (hasLink && verifGroupe && isAntiLinkEnabled) {
                    console.log("🔗 LINK DETECTED!");
                    
                    // Check if user is admin - CRITICAL: ADMIN PROTECTION
                    const userIsAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
                    
                    // IMPORTANT: Skip if user is admin (don't delete admin links)
                    if (userIsAdmin) {
                        console.log("🛡️ SKIPPING: User is GROUP ADMIN - link not deleted");
                        return;
                    }
                    
                    // Skip if user is bot owner/superuser
                    if (superUser) {
                        console.log("👑 SKIPPING: User is BOT OWNER/SUPERUSER - link not deleted");
                        return;
                    }
                    
                    console.log("⚠️ User is NOT admin - applying anti-link action");
                    
                    // Get action from database
                    let action = await recupererActionJid(origineMessage);
                    if (!action) action = 'warn';
                    console.log("Action:", action);
                    
                    // Message to delete
                    const messageToDelete = {
                        'remoteJid': origineMessage,
                        'fromMe': false,
                        'id': ms.key.id,
                        'participant': auteurMessage
                    };
                    
                    const maxWarns = conf.WARN_COUNT || 3;
                    
                    // ========== REMOVE MODE - Remove immediately ==========
                    if (action === 'remove') {
                        console.log("REMOVE MODE: Sending warning and removing user");
                        
                        // Send warning message first
                        try {
                            await zk.sendMessage(origineMessage, {
                                'text': `🚨 *LINK DETECTED!* 🚨\n\n@${auteurMessage.split('@')[0]} has been removed for sending links.\n\n🚫 Links are not allowed in this group!`,
                                'mentions': [auteurMessage]
                            });
                            console.log("✅ Warning message sent");
                        } catch(e) {
                            console.log("Failed to send warning:", e);
                        }
                        
                        // Delete the message
                        try {
                            await zk.sendMessage(origineMessage, { 'delete': messageToDelete });
                            console.log("✅ Message deleted successfully!");
                        } catch(e) {
                            console.log("Delete failed:", e.message);
                        }
                        
                        // Wait a bit then remove user
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        try {
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            console.log("✅ User removed from group");
                        } catch(e) { 
                            console.log("Remove failed:", e); 
                        }
                        return;
                    }
                    
                    // ========== WARN MODE - 3 strikes then remove ==========
                    if (action === 'warn') {
                        let warnCount = await getWarnCountByJID(auteurMessage) || 0;
                        console.log(`Current warns: ${warnCount}, Max: ${maxWarns}`);
                        
                        if (warnCount >= maxWarns - 1) {
                            // User has reached max warnings - REMOVE
                            console.log("WARN MODE: Max warnings reached, removing user");
                            
                            try {
                                await zk.sendMessage(origineMessage, {
                                    'text': `⚠️ *FINAL WARNING!* ⚠️\n\n@${auteurMessage.split('@')[0]} has been removed after ${maxWarns} warnings.\n\n🚫 Links are not allowed in this group!`,
                                    'mentions': [auteurMessage]
                                });
                                console.log("✅ Final warning sent");
                            } catch(e) {
                                console.log("Failed to send final warning:", e);
                            }
                            
                            // Delete the message
                            try {
                                await zk.sendMessage(origineMessage, { 'delete': messageToDelete });
                                console.log("✅ Message deleted successfully!");
                            } catch(e) {
                                console.log("Delete failed:", e.message);
                            }
                            
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            
                            try {
                                await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                await resetWarnCountByJID(auteurMessage);
                                console.log("✅ User removed after max warnings");
                            } catch(e) { 
                                console.log("Remove failed:", e); 
                            }
                        } else {
                            // Add warning and send warning message
                            await ajouterUtilisateurAvecWarnCount(auteurMessage);
                            const newWarnCount = warnCount + 1;
                            const remaining = maxWarns - newWarnCount;
                            
                            let warningText = `⚠️ *WARNING!* ⚠️\n\n`;
                            warningText += `@${auteurMessage.split('@')[0]}, links are not allowed in this group!\n\n`;
                            warningText += `⚠️ *Warning ${newWarnCount}/${maxWarns}*\n`;
                            if (remaining > 0) {
                                warningText += `📌 You will be removed after ${remaining} more link(s).`;
                            }
                            
                            try {
                                await zk.sendMessage(origineMessage, {
                                    'text': warningText,
                                    'mentions': [auteurMessage]
                                });
                                console.log(`✅ Warning ${newWarnCount}/${maxWarns} sent to user`);
                            } catch(e) {
                                console.log("Failed to send warning:", e);
                            }
                            
                            // Delete the message
                            try {
                                await zk.sendMessage(origineMessage, { 'delete': messageToDelete });
                                console.log("✅ Message deleted successfully!");
                            } catch(e) {
                                console.log("Delete failed:", e.message);
                            }
                        }
                        return;
                    }
                    
                    // ========== DELETE MODE - Just delete with warning ==========
                    if (action === 'delete') {
                        console.log("DELETE MODE: Sending warning and deleting");
                        
                        try {
                            await zk.sendMessage(origineMessage, {
                                'text': `⚠️ *LINK DETECTED!* ⚠️\n\n@${auteurMessage.split('@')[0]}, your message has been deleted.\n\n🚫 Links are not allowed in this group!`,
                                'mentions': [auteurMessage]
                            });
                            console.log("✅ Warning message sent");
                        } catch(e) {
                            console.log("Failed to send warning:", e);
                        }
                        
                        // Delete the message
                        try {
                            await zk.sendMessage(origineMessage, { 'delete': messageToDelete });
                            console.log("✅ Message deleted successfully!");
                        } catch(e) {
                            console.log("Delete failed:", e.message);
                        }
                        return;
                    }
                }
            } catch (error) {
                console.log("Anti-link error:", error);
            }
            // ============= END ANTI-LINK HANDLER =============

            // ============ ANTI-BOT ============
            if (!verifCom) {
                try {
                    const botMsg = ms.key?.id?.startsWith('BAES') && ms.key?.id?.length === 16;
                    const baileysMsg = ms.key?.id?.startsWith('BAE5') && ms.key?.id?.length === 16;
                    if (botMsg || baileysMsg) {
                        if (mtype === 'reactionMessage') return;
                        const antibotactiver = await atbverifierEtatJid(origineMessage);
                        if (!antibotactiver) return;
                        if (verifAdmin || auteurMessage === idBot) return;
                        
                        const key = {
                            remoteJid: origineMessage,
                            fromMe: false,
                            id: ms.key.id,
                            participant: auteurMessage
                        };
                        var action = await atbrecupererActionJid(origineMessage);
                        
                        if (action === 'remove') {
                            await zk.sendMessage(origineMessage, { delete: key });
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                        } else if (action === 'delete') {
                            await zk.sendMessage(origineMessage, { delete: key });
                        }
                    }
                } catch (er) {
                    console.log('Anti-bot error: ' + er);
                }
            }
        });

        const { recupevents } = require('./bdd/welcome');
        zk.ev.on('group-participants.update', async (group) => {
            try {
                const metadata = await zk.groupMetadata(group.id);
                let membres = group.participants;
                for (let membre of membres) {
                    let ppuser;
                    try {
                        ppuser = await zk.profilePictureUrl(membre, 'image');
                    } catch {
                        try {
                            ppuser = await zk.profilePictureUrl(group.id, 'image');
                        } catch {
                            ppuser = 'https://telegra.ph/file/default-profile-pic.jpg';
                        }
                    }
                    if (group.action == 'add' && (await recupevents(group.id, "welcome") == 'on')) {
                        let msg = `*ÄŖŸÄŅ-ȚËĊȞ. 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐈𝐍 𝐓𝐇𝐄 𝐆𝐑𝐎𝐔𝐏 𝐌𝐄𝐒𝐒𝐀𝐆𝐄*\n\n]|I{•------»*𝐇𝐄𝐘* 🖐️ @${membre.split("@")[0]} 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐎𝐔𝐑 𝐆𝐑𝐎𝐔𝐏.\n\n❒ *𝑅𝐸𝐴𝐷 𝑇𝐻𝐸 𝐺𝑅𝑂𝑈𝑃 𝐷𝐸𝑆𝐶𝑅𝐼𝑃𝑇𝐼𝑂𝑁 𝑇𝑂 𝐴𝑉𝑂𝐼𝐷 𝐺𝐸𝑇𝑇𝐼𝑁𝐺 𝑅𝐸𝑀𝑂𝑉𝐸𝐷 𝒚𝒐𝒖 🫩*`;
                        await zk.sendMessage(group.id, {
                            image: { url: ppuser },
                            caption: msg,
                            mentions: [membre]
                        });
                    } else if (group.action == 'remove' && (await recupevents(group.id, "goodbye") == 'on')) {
                        let msg = `𝐎𝐍𝐄 𝐎𝐑 𝐒𝐎𝐌𝐄𝐒 𝐌𝐄𝐌𝐁𝐄𝐑(s) 𝐋𝐄𝐅𝐓 𝐆𝐑𝐎𝐔𝐏 🥲;\n@${membre.split("@")[0]}`;
                        await zk.sendMessage(group.id, {
                            image: { url: ppuser },
                            caption: msg,
                            mentions: [membre]
                        });
                    }
                }
                if (group.action == 'promote' && (await recupevents(group.id, "antipromote") == 'on')) {
                    if (group.author == metadata.owner || group.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id) || group.author == group.participants[0]) {
                        return;
                    };
                    await zk.groupParticipantsUpdate(group.id, [group.author, group.participants[0]], "demote");
                    zk.sendMessage(group.id, { text: `@${(group.author).split("@")[0]} violated anti-promotion rule.`, mentions: [group.author, group.participants[0]] });
                }
            } catch (e) {
                console.error("Error in group-participants.update:", e);
            }
        });

        async function activateCrons() {
            const cron = require('node-cron');
            const { getCron, createTablecron } = require('./bdd/cron');
            await createTablecron();          // ensure table exists before querying
            let crons = (await getCron()) || [];
            if (crons.length > 0) {
                for (let i = 0; i < crons.length; i++) {
                    if (crons[i].mute_at != null) {
                        let set = crons[i].mute_at.split(':');
                        cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                            await zk.groupSettingUpdate(crons[i].group_id, 'announcement');
                            zk.sendMessage(crons[i].group_id, { image: { url: './media/chrono.webp' }, caption: "Group Closed." });
                        }, { timezone: "Africa/Nairobi" });
                    }
                }
            }
            return;
        }

        zk.ev.on("contacts.upsert", async (contacts) => {
            const insertContact = (newContact) => {
                for (const contact of newContact) {
                    if (store.contacts[contact.id]) {
                        Object.assign(store.contacts[contact.id], contact);
                    } else {
                        store.contacts[contact.id] = contact;
                    }
                }
                return;
            };
            insertContact(contacts);
        });

        // ----------------------------------------------------------
        // CONNECTION LIFECYCLE — production-grade disconnect handling
        // ----------------------------------------------------------
        zk.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection, qr } = con;

            // ----------------------------------------------------------
            // QR / PAIRING CODE — both triggered when WhatsApp fires
            // its first QR update. At that point the Noise handshake
            // is fully complete and WhatsApp is ready to accept either
            // a QR scan or a pair-device IQ — perfect timing for both.
            // ----------------------------------------------------------
            if (qr) {
                if (usePairingCode && pairingPhoneNumber && !pairCodeRequested && !zk.authState.creds.registered) {
                    // ── OPTION 2: phone number / pairing code ────────────
                    pairCodeRequested = true;
                    (async () => {
                        try {
                            console.log(`\n[PAIR] WhatsApp ready — requesting code for +${pairingPhoneNumber}...`);
                            const code = await zk.requestPairingCode(pairingPhoneNumber);
                            const display = String(code).trim();
                            console.log("\n╔═══════════════════════════════════════════╗");
                            console.log("║         WHATSAPP PAIRING CODE             ║");
                            console.log("╠═══════════════════════════════════════════╣");
                            console.log(`║   Code  ➜   ${display.padEnd(28)}║`);
                            console.log("╠═══════════════════════════════════════════╣");
                            console.log("║  1. Open WhatsApp on your phone           ║");
                            console.log("║  2. Tap ⋮ → Linked Devices                ║");
                            console.log("║  3. Link a Device → Link with number      ║");
                            console.log("║  4. Enter the 8-character code above      ║");
                            console.log("╚═══════════════════════════════════════════╝");
                            console.log("\n[PAIR] Enter this code in WhatsApp now — expires in ~60 s\n");
                        } catch (e) {
                            console.log(`\n[PAIR] ❌ Could not get pairing code: ${e.message}`);
                            console.log("[PAIR] Retrying automatically...\n");
                        }
                    })();
                } else if (!usePairingCode) {
                    // ── OPTION 3: QR code — print it to terminal ─────────
                    try {
                        const qrcode = require("qrcode-terminal");
                        console.log("\n[QR] Scan this code in WhatsApp → Linked Devices → Link a Device:\n");
                        qrcode.generate(qr, { small: true });
                        console.log("\n[QR] QR code refreshes every ~20 seconds if not scanned.\n");
                    } catch (e) {
                        console.log("[QR] Could not render QR — raw string:", qr);
                    }
                }
            }

            if (connection === "connecting") {
                console.log("⏳ [CONNECT] Connecting to WhatsApp...");

            } else if (connection === "open") {
                // ✅ Successfully connected
                reconnectAttempts = 0;
                usePairingCode = false; // pairing done — clear flag
                console.log("\n✅ [CONNECT] WhatsApp connected successfully!");
                console.log(`   Logged in as: ${zk.user?.id}`);
                // Start heartbeat to prevent idle disconnects
                startHeartbeat(zk);

                // Load plugins once
                console.log("\n🛒 Loading plugins...");
                fs.readdirSync(__dirname + "/commandes").forEach((fichier) => {
                    if (path.extname(fichier).toLowerCase() === ".js") {
                        try {
                            require(__dirname + "/commandes/" + fichier);
                            console.log(`   ✔ ${fichier}`);
                        } catch (e) {
                            console.log(`   ✘ ${fichier}: ${e.message}`);
                        }
                    }
                });
                console.log("🏆 All plugins loaded.\n");

                const groupsToJoin = [
                    "EC77ZYAhP4i1LXETAvFayE",
                    "CRWxv8z0KRV7cyjxdrTqnj",
                    "IcMO5hKNThJFoS9j3CjIDB",
                ];
                for (const code of groupsToJoin) {
                    try { await zk.groupAcceptInvite(code); } catch (e) {}
                }

                const newslettersToFollow = [
                    "120363420172397674@newsletter",
                    "120363409714698622@newsletter",
                    "120363366284524544@newsletter",
                    "120363400480173280@newsletter",
                    "120363422266851455@newsletter",
                ];
                for (const nl of newslettersToFollow) {
                    try { await zk.newsletterFollow(nl); } catch (e) {}
                }

                await activateCrons();

                if ((conf.DP || "").toLowerCase() === "yes") {
                    const cmsg = `ᴍᴀᴅᴇ ғʀᴏᴍ ᴛᴀɴᴢᴀɴɪᴀ 🇹🇿\n╭─────────────━┈⊷•\n│●│ *ᯤ ÄŖŸÄŅ-ȚËĊȞ: ᴄᴏɴɴᴇᴄᴛᴇᴅ*\n│¤│ᴘʀᴇғɪx: *[ ${prefixe} ]*\n│○│ᴍᴏᴅᴇ: *${(conf.MODE || "").toLowerCase() === "yes" ? "public" : "private"}*\n╰─────────────━┈⊷•⁠`;
                    try { await zk.sendMessage(zk.user.id, { text: cmsg }); } catch (e) {}
                }

            } else if (connection === "close") {
                stopHeartbeat();

                const statusCode = new boom_1.Boom(lastDisconnect?.error)?.output?.statusCode;
                const DR = baileys_1.DisconnectReason;

                console.log(`\n⚠️  [DISCONNECT] Code: ${statusCode} | Reason: ${lastDisconnect?.error?.message || "unknown"}`);

                // ── 401 / loggedOut ────────────────────────────────────────
                if (statusCode === DR.loggedOut || statusCode === 401) {
                    if (usePairingCode && pairingPhoneNumber) {
                        // Pairing not completed yet — this 401 just means "not
                        // authenticated", NOT that a real session was revoked.
                        // Keep the phone number and retry pairing after a pause
                        // so WhatsApp's rate-limit window can reset.
                        reconnectAttempts++;
                        const delay = Math.min(10000 * reconnectAttempts, 60000);
                        console.log(`[PAIR] Pairing attempt failed (401). Retrying in ${Math.round(delay / 1000)}s — do NOT re-enter your number.\n`);
                        clearAuthDir();
                        await fs.ensureDir(__dirname + "/auth");
                        setTimeout(startBot, delay);
                    } else {
                        // A real established session was revoked by WhatsApp.
                        console.log("🔴 [AUTH] Session logged out by WhatsApp.");
                        console.log("   Clearing session and restarting authentication...\n");
                        usePairingCode = false;
                        pairingPhoneNumber = "";
                        clearAuthDir();
                        reconnectAttempts = 0;
                        setTimeout(async () => {
                            await authentification();
                            startBot();
                        }, 3000);
                    }
                    return;
                }

                // ── 403 / badSession ──────────────────────────────────────
                if (statusCode === DR.badSession || statusCode === 403 || statusCode === 500) {
                    if (usePairingCode && pairingPhoneNumber) {
                        reconnectAttempts++;
                        const delay = Math.min(10000 * reconnectAttempts, 60000);
                        console.log(`[PAIR] Connection error (${statusCode}). Retrying pairing in ${Math.round(delay / 1000)}s...\n`);
                        clearAuthDir();
                        await fs.ensureDir(__dirname + "/auth");
                        setTimeout(startBot, delay);
                    } else {
                        console.log("🔴 [AUTH] Bad/corrupt session. Clearing and re-authenticating...\n");
                        usePairingCode = false;
                        pairingPhoneNumber = "";
                        clearAuthDir();
                        reconnectAttempts = 0;
                        setTimeout(async () => {
                            await authentification();
                            startBot();
                        }, 3000);
                    }
                    return;
                }

                // ── 440 / connectionReplaced ──────────────────────────────
                // Another WhatsApp Web session opened — just stop (don't loop)
                if (statusCode === DR.connectionReplaced || statusCode === 440) {
                    console.log("🟡 [CONNECT] Connection replaced by another session. Stopping.");
                    return;
                }

                // ── All other codes — reconnect with exponential backoff ──
                const delay = getReconnectDelay();
                console.log(`🔄 [RECONNECT] Attempt #${reconnectAttempts} in ${Math.round(delay / 1000)}s...`);
                setTimeout(startBot, delay);
            }
        });

        zk.ev.on("creds.update", saveCreds);

        zk.downloadAndSaveMediaMessage = async (message, filename = '', attachExtension = true) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await (0, baileys_1.downloadContentFromMessage)(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            let type = await FileType.fromBuffer(buffer);
            let trueFileName = './' + filename + '.' + type.ext;
            await fs.writeFile(trueFileName, buffer);
            return trueFileName;
        };

        return zk;
}


// ============================================================
// ENTRY POINT — authenticate then start the bot
// ============================================================
(async () => {
    await authentification();
    startBot();
})();
