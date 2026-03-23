# Architecture

## Tech Stack
- Vanilla JS (no framework), HTML5, CSS3 with custom properties
- Chart.js 4.4.7 for visualizations
- Cloudflare Workers + KV for config persistence, auth, and AI chat
- Deployed: GitHub Pages (internal) / Cloudflare Pages (customer)
- ProtoGuide companion panel calls `_prototypeGuideAPI` directly (no postMessage/iframe)

## Directory Structure
```
index.html              Redirect to protoguide-login.html (entry point)
app.js                  Main application logic (~6000 lines, global state)
admin-assistant.js      AI onboarding assistant (~6800 lines, Sonnet-powered)
assistant-storage.js    localStorage-based session memory for the AI assistant
widget-catalog.js       Static widget/section/team definitions
dashboard-config.js     Config serialization and Cloudflare KV sync
profile.js              Runtime profile detection (internal vs customer)
styles.css              Complete styling (~6500 lines)
assets/                 Images (robot transition PNGs/SVGs)
synthetic-data/
  base-analytics.js     Mock data generator for KPIs, charts, tables
mock-customers/         6 test customer profiles (JSON) + index
tests/
  protoguide-tests.mjs  ProtoGuide panel test suite
protoguide/
  protoguide-login.html Login page (Google Identity Services auth)
  protoguide-login.css  Login page styling
  protoguide.html       Companion panel HTML
  protoguide.js         Panel logic: chat, feedback, settings/admin bridge (~2100 lines)
  protoguide.css        Panel styling (~2800 lines)
chatbot-proxy/
  worker.js             Cloudflare Worker (routes below)
  analytics-query.js    Semantic natural-language query executor for mock data
  wrangler.toml         KV bindings: DASHBOARD_CONFIG, CUSTOMER_PROFILES, PROTOGUIDE_AUTH
```

## Entry Flow
1. User visits `index.html` → redirects to `protoguide/protoguide-login.html`
2. Login via Google Identity Services → Bearer token stored in localStorage
3. Authenticated → loads `protoguide/protoguide.html` which embeds the analytics dashboard

## Data Flow
1. Page load → profile.js detects environment → app.js bootstraps global `state`
2. Config sync → dashboard-config.js calls Worker `/config/{userId}` via PROXY_URL
3. UI changes → `DashboardConfig.notifyChanged()` → debounced save to KV (1500ms)
4. Conflict (409) → server config reapplied, UI re-renders
5. Widget render → section mounts → `renderWidget()` per visible widget

## Worker API Routes (chatbot-proxy/worker.js)
- `/config/{userId}` — GET/PUT dashboard config (KV persistence)
- `/profile` — GET customer profile
- `/onboarding/chat` — POST AI onboarding chat (Anthropic API)
- `/extract-url` — POST extract URL content
- `/analytics/query` — POST natural-language analytics query
- `/protoguide/auth/check` — POST auth verification
- `/protoguide/users` — GET/POST user management
- `/protoguide/users/:email` — DELETE user
- `/protoguide/domains` — GET/POST domain allowlisting
- `/protoguide/domains/:domain` — DELETE domain
- `/protoguide/feedback` — GET/POST feedback submissions
- `/protoguide/feedback/:id` — PUT/DELETE feedback

## ProtoGuide Integration
- ProtoGuide companion panel calls `_prototypeGuideAPI` directly (no postMessage bridge)
- AI context is embedded in protoguide.js (not loaded from a separate file)
- `_prototypeGuideAPI` exposes settings/admin control surface (setRole, setFlag, triggerAction)
- When standalone (no ProtoGuide), API functions are harmless no-ops

## Widget System
- Each widget: `id`, `title`, `type` (kpi/bar-chart/table/list/etc), `vis` (always/default/hidden)
- Visibility layers (in order): base vis → role+lens state overrides → team usecases (feature flag) → channel filters → individual hide/add state
- `getEffectiveVisibility(w)` resolves all layers
- Widgets keyed by section: overview, understand, operate, improve, automate

## Sections & Navigation
- Tab mode (default): only active section renders
- Anchors mode (feature flag): IntersectionObserver lazy-mounts visible sections
- Each tab owns widgets via `state.tabWidgets[tabId]`
- Drag-to-reorder and resize within sections

## Config Persistence
- Optimistic concurrency with revision numbers
- On 409 conflict: server state wins, local edits lost
- Config shape validated server-side (tabs, widgets, lens, role)

## Feature Flags
- LocalStorage-based: `anchors-nav`, `onboarding-transition`
- Controlled via ProtoGuide settings overlay

## Key Patterns
- Global event delegation for nav, filters, drawers
- Mock data generated client-side (rand, randF, pickTrend, paletteCycle)
- Chart.js instances tracked in `state.charts[widgetId]`, destroyed on unmount
- Onboarding overlay: independent step-through, completion persisted in localStorage
- AI onboarding assistant: Sonnet-powered setup flow via admin-assistant.js
- Assistant session memory: localStorage-based via assistant-storage.js (structured facts, team assignments, goals, proposals)
