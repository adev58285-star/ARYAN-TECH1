# ÄŖŸÄŅ-ȚËĊȞ (Aryan-MD) WhatsApp Bot

## Overview
A feature-rich, multi-device WhatsApp bot built with Node.js using the Baileys library. It supports group management, media processing, AI interactions, and many automated features.

## Architecture
- **Runtime:** Node.js 20
- **Main entry:** `index.js`
- **Config:** `set.js` (loads from `set.env` or environment variables)
- **Commands:** `commandes/` directory (plugin-based)
- **Framework:** `framework/zokou.js` (command registration), `framework/app.js` (message handling)
- **Database:** `bdd/` directory — SQLite (local) or PostgreSQL via Sequelize ORM
- **Session auth:** `auth/creds.json` (WhatsApp credentials)

## Key Dependencies
- `@whiskeysockets/baileys` — WhatsApp Web API library
- `express` — lightweight web server (keep-alive)
- `sequelize` + `sqlite3` / `pg` — ORM with SQLite/PostgreSQL support
- `fluent-ffmpeg` — media processing
- `wa-sticker-formatter` — sticker creation
- `dotenv` — environment variable management

## Connection Architecture (Production-grade)
- **Process guards:** `uncaughtException` + `unhandledRejection` handlers prevent crashes
- **Authentication flow:** 3-option interactive menu (Session ID / Pairing code / QR code)
  - Stale/unregistered creds auto-cleared on startup
  - 401 (loggedOut) triggers auth menu instead of looping
  - 403/500 (badSession) also triggers clean re-auth
- **Reconnect:** Exponential backoff (5s → 60s cap) for all disconnect reasons
- **Heartbeat:** Sends `sendPresenceUpdate('available')` every 25s to prevent idle disconnects
- **Keepalive:** Baileys `keepAliveIntervalMs: 15_000` WebSocket pings
- **Restart command:** `commandes/restart.js` — `.restart` exits cleanly (workflow auto-restarts), session preserved

## Workflow
- **Start application** — runs `node index.js` as a console workflow

## Environment Variables (set in set.env or Replit Secrets)
- `SESSION_ID` — WhatsApp session/credentials (base64 encoded)
- `PREFIX` — Bot command prefix (default: `.`)
- `OWNER_NAME` — Bot owner name
- `NUMERO_OWNER` — Owner's WhatsApp number
- `DATABASE_URL` — PostgreSQL connection URL (optional, uses SQLite if not set)
- `PUBLIC_MODE` — Whether bot responds to everyone (default: no)
- `BOT_NAME` — Bot display name
- `OPENAI_API_KEY` — For GPT integration
- See `exemple_de_set.env` for full list

## Notes
- The bot connects to WhatsApp Web via QR code or session ID
- `auth/creds.json` stores the WhatsApp session credentials
- Database tables are auto-created on startup via Sequelize
- The package name was changed from the original Unicode name to `aryan-tech-bot` for npm compatibility
- Baileys was switched from a GitHub fork (`github:xhclintohn/Baileys`) to the official npm package `@whiskeysockets/baileys@6.7.5`
