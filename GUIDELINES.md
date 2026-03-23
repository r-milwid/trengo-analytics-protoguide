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

## Decisions & Patterns
<!-- When something is corrected or a non-obvious decision is made, rewrite this section to reflect it. Current-state only — no changelog. -->
