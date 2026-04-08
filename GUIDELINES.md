# Project Guidelines

## This Is a Prototype

Speed and demo quality over robustness. Shortcuts are fine. Large files are fine. Global state is fine. The bar is: does it work well enough to demonstrate the concept to stakeholders?

## Hard Rules (even for prototypes)

- **Vanilla JS only** — no React, Vue, or any framework. No build step. CDN imports only (Chart.js, Google Fonts).
- **No hardcoded secrets** — API keys go in the Worker's wrangler.toml or Cloudflare secrets, never in client-side code.
- **Keep ARCHITECTURE.md current** — when you change how major components work or add new ones, run `/update-docs ARCHITECTURE.md`.
- **After corrections** — when something is corrected or a non-obvious decision is made, note it in this file under Decisions & Patterns.

## ProtoGuide Integration

ProtoGuide lives in `protoguide/` and calls `window._prototypeGuideAPI` directly (no iframe, no postMessage). The analytics app exposes settings/admin data via this API object. ProtoGuide auth uses Google Identity Services with Bearer tokens stored in localStorage.

## Available Skills

- `/architecture` — loads ARCHITECTURE.md snapshot for design questions (auto-invocable)
- `/update-docs [filename]` — enforced read-first-then-rewrite procedure for maintaining docs (user-invoked)
- `/self-review` — lightweight pre-commit check for prototypes (user-invoked)
- `/design` — enforces Trengo design system tokens and component patterns before any UI work (auto-invocable)

## Deployment

- **Frontend** (protoguide.html, protoguide.js, app.js, etc.) deploys via Cloudflare Pages on git push.
- **Worker** (`chatbot-proxy/worker.js`) must be deployed separately: `cd chatbot-proxy && npx wrangler deploy`.
- **Always deploy the Worker** when finishing work that touches `chatbot-proxy/worker.js`. Don't wait for the user to ask.

## Decisions & Patterns
<!-- When something is corrected or a non-obvious decision is made, rewrite this section to reflect it. Current-state only — no changelog. -->

- **Feedback is soft-deleted** — the Worker DELETE endpoint sets `deleted: true` + `deletedAt` on the entry rather than removing it from the array. Frontend filters on `s.deleted` at display time. Feedback data is never permanently removed.
- **Feedback text field** — stored as `text` in KV. Frontend reads `item.text || item.rawText || item.raw_text` for backward compatibility.
- **ProtoGuide chat tool payloads** — `show_choices` uses `options` with `id`/`label`, and the frontend normalizes the older `items`/`value` shape for backward compatibility so choice prompts never render as an empty trailing sentence.
- **ProtoGuide tool-turn integrity** — every assistant `tool_use` in a ProtoGuide response must be matched by a `tool_result` on the next client turn. Extra or unrenderable tools are skipped explicitly, and unsupported tool names surface a visible fallback instead of leaving the chat hanging.
- **ProtoGuide naming** — ProtoGuide is directly embedded in the analytics prototype. Do not use legacy iframe-app naming in code, comments, tests, or docs.
