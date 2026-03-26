# Trengo Analytics Prototype

Clickable HTML/CSS/JS prototype of Trengo's AI-native analytics system with an embedded ProtoGuide companion panel. This is a **prototype** — optimize for speed, demo quality, and user comprehension over production robustness.

**Stack:** Vanilla JS + HTML + CSS + Chart.js. Cloudflare Worker proxy for config persistence and AI chat. No frameworks, no build step.

## How to Run

| Task | Command |
|------|---------|
| Prototype (port 3000) | Use Codex Preview or `npx http-server . -p 3000` |
| Worker proxy | `cd chatbot-proxy && npx wrangler dev` |
| Deploy Worker | `cd chatbot-proxy && npx wrangler deploy` |

## Key Files

- `app.js` — Main UI logic, global state, event delegation (~6000 lines)
- `admin-assistant.js` — AI onboarding agent and post-onboarding assistant (~6800 lines)
- `widget-catalog.js` — Static widget/section/team definitions
- `dashboard-config.js` — Config serialization and KV sync
- `profile.js` — Environment detection (internal vs customer)
- `protoguide/protoguide.js` — Companion panel: chat, feedback, settings/admin bridge
- `chatbot-proxy/worker.js` — Cloudflare Worker: config, chat, analytics query endpoints
- `synthetic-data/base-analytics.js` — Mock data generator
- `mock-customers/` — 6 test customer profiles

## Prototype Rules

- Speed and functionality first — don't over-engineer
- Vanilla JS only — no frameworks, no build tools
- It's okay to have large files, global state, and shortcuts
- Fix it if it breaks the demo; skip it if it's just "not ideal"

@GUIDELINES.md
