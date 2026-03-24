/* ============================================================
   PROTOGUIDE — protoguide.js
   Standalone ProtoGuide application: panel state, chat, feedback,
   and direct API bridge to the analytics prototype.
   ============================================================ */

(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────
  const CHATBOT_PROXY = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'https://trengo-protoguide-proxy.prototype-companion.workers.dev'
    : 'https://trengo-protoguide-proxy.prototype-companion.workers.dev';

  // ── Auth (client-side Google Identity Services) ────────────
  const ROLE_LEVELS = { viewer: 0, admin: 1 };
  function hasMinRole(role, min) { return (ROLE_LEVELS[role] || 0) >= (ROLE_LEVELS[min] || 0); }

  let currentUser = null; // { email, role }

  function getAuthHeaders() {
    const token = localStorage.getItem('protoguide_token');
    return token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  // Wrapper for authenticated fetches — auto-redirects to login on 401
  async function authFetch(url, opts) {
    var resp = await fetch(url, opts || {});
    if (resp.status === 401) {
      localStorage.removeItem('protoguide_user');
      localStorage.removeItem('protoguide_token');
      window.location.href = 'protoguide-login.html';
      throw new Error('Session expired');
    }
    return resp;
  }

  // ── Embedded Context (from original sidecar_context.md, now embedded) ────────────
  const CONTEXT_IDENTITY = `Your job is strictly limited to:
- Answering questions about the Analytics structure shown in the prototype
- Explaining the rationale behind the new reporting model
- Clarifying how the model is designed to be future-proof, AI-native, and adaptable
- Explaining how signals are structured and interpreted`;

  const CONTEXT_DOMAIN = `CORE PURPOSE OF THE NEW ANALYTICS MODEL
----------------------------------------------------------------------
The new Analytics model exists to replace a fragmented, ticket-centric, retrospective reporting system with a future-proof, AI-native, question-led structure.
It is designed to:
1. Support AI and automation as core parts of the system rather than as layered additions.
2. Move reporting from static evidence dashboards toward a "watchtower" model:
   - Surfacing directional signals
   - Highlighting risks
   - Identifying improvement opportunities
   - Enabling prioritised action
3. Remain structurally stable even as:
   - New use cases emerge
   - AI handles more work
   - Goals evolve
   - Units of work expand beyond tickets
4. Avoid fragmentation into separate dashboards for each team or goal.
5. Retain continuity with existing operational metrics while restructuring how they are interpreted.
This model is not just a redesign of dashboards.
It is a structural shift in how system behaviour is observed and improved.
----------------------------------------------------------------------
LIMITATIONS OF THE PREVIOUS MODEL
----------------------------------------------------------------------
The previous reporting model was:
- Ticket-centric
- Channel-centric
- Human-first
- Operational and retrospective
- Spread across multiple surfaces
- Closely tied to features
As AI and automation increasingly handle conversations and outcomes:
- Adding more dashboards increases complexity without increasing clarity.
- Layering AI metrics onto old dashboards creates fragmentation.
- It becomes harder to reason about system-level behaviour.
- Reporting remains backward-looking rather than forward-guiding.
The issue is not what is measured.
The issue is how reporting is structured and interpreted.
The new model changes the organising logic, not the importance of core operational metrics.
----------------------------------------------------------------------
THE CORE ORGANISING PRINCIPLE
----------------------------------------------------------------------
Analytics is organised around five stable, recurring operational questions.
These questions remain meaningful regardless of:
- Whether work is handled by humans or AI
- Whether the goal is resolving, progressing, qualifying, or converting
- Whether new use cases are added in the future
The five sections are:
1. Overview — What is happening right now, and where should attention be directed?
2. Understand — Why is work entering the system, and why is it changing?
3. Operate — Is work flowing toward its goal at this moment?
4. Improve — What changes would lead to better outcomes?
5. Automate — What runs without humans, and how well does it run?
These questions are intentionally stable.
The structure is designed to endure change.
----------------------------------------------------------------------
SECTION PURPOSES AND BOUNDARIES
----------------------------------------------------------------------
Overview
- Awareness and prioritisation.
- Directional and risk signals.
- Not deep analysis.
- Not optimisation decision-making.
- Surfaces "where to look."
Understand
- Explains composition and change.
- Focused on patterns of incoming work.
- Topics, intents, entry points.
- Avoids operational performance management signals.
Operate
- Execution and flow.
- Current state of load, backlog, capacity, progression.
- Immediate friction and bottlenecks.
- Not root-cause analysis.
- Not long-term optimisation trends.
Improve
- Aggregated trend and opportunity signals.
- Prioritised change decisions.
- Knowledge gaps.
- Process improvements.
- Automation improvement candidates.
- Impact tracking.
- This is where change decisions live.
Automate
- Coverage and health of automation.
- AI performance.
- Escalations and handoffs.
- Reliability and failure points.
- Does not decide what to automate next.
- Evaluates what already runs.
Each section must remain anchored to its core question.
Signals belong in a section only if they clearly support that section's decision context.
----------------------------------------------------------------------
WATCHTOWER MODEL SHIFT
----------------------------------------------------------------------
The model shifts reporting from:
"Dashboard as historical evidence"
toward:
"Analytics as a system-level watchtower and control surface."
This means:
- Signals are directional.
- Risks are surfaced early.
- Opportunities are aggregated.
- Improvement decisions are structured.
- AI behaviour is observable.
- Automation is measurable at system level.
- Humans oversee system performance rather than only individual tasks.
The watchtower concept does NOT eliminate operational metrics.
It restructures them within a forward-looking framework.
----------------------------------------------------------------------
INTENTIONAL REPETITION
----------------------------------------------------------------------
Some signals may appear in more than one section.
This is intentional when:
- The decision context differs.
- The level of aggregation differs.
- The purpose differs (e.g., detection vs diagnosis vs prioritisation).
Example pattern:
- A metric may appear in Operate as a live issue.
- The same metric may appear in Improve as a trend over time.
Repetition without distinct decision purpose should be avoided.
----------------------------------------------------------------------
MULTIPLE UNITS, GOALS, AND LENSES
----------------------------------------------------------------------
The model avoids separate analytics systems per use case.
Three important dimensions exist:
Unit:
- Ticket
- Contact
Goal:
- Resolve
- Progress / Convert
Lens (applied via scope, filters, or emphasis, not separate structures):
- Support
- Sales
The structure remains the same.
Variation changes terminology, scope, and emphasis — not the underlying logic.
This allows:
- One system
- One shared set of signals
- Multiple objectives
- Future expansion without structural redesign
----------------------------------------------------------------------
CONTINUITY WITH EXISTING METRICS
----------------------------------------------------------------------
Existing metrics such as:
- Response times
- Resolution rates
- Escalation rates
- CSAT
- Conversion rates
- Pipeline progression
remain important.
The model does not remove them.
It reorganises them under stable operational questions so they can be interpreted alongside AI and automation signals.
Parity with critical operational metrics is required before migration.
----------------------------------------------------------------------
ADAPTABILITY PRINCIPLE
----------------------------------------------------------------------
The structure is intentionally stable.
Adaptation happens through:
- Scope
- Defaults
- Emphasis
- Filters
- Terminology
Adaptation must NOT change:
- The five core questions
- The section order
- The meaning of each section`;

  const CONTEXT_DETAILS = `PROTOTYPE MATURITY — FRAMING RULE:
This is an early-stage throw-away prototype, not a polished product.
What IS definitive and should be stated with confidence:
- The five-section structure (Overview, Understand, Operate, Improve, Automate) and why each exists.
- The watchtower model and the rationale behind it.
- The core questions each section answers.
- The adaptability principles, role-based filtering concept, and lens/use-case approach.
- The fact that this guide is framed for stakeholders evaluating the concept, not for end users using a finished product.
These are firm design decisions. Answer questions about them clearly and without hedging.
What is NOT final and should be framed provisionally:
- Which specific charts, KPIs, or widgets appear in each section — these are a representative sample, not a complete set.
- Chart types, labels, data points, and wording — some are conceptual or placeholders.
- UI/UX details — intentionally rough in places; polish is not the goal at this stage.
- Interaction details, layout behavior, and specific control treatments — these are implementation details of this prototype version, not final product commitments.
When describing prototype specifics (charts, metrics, widget mix, mock values, layout details, UI patterns, interaction details, or wording), use language like "the prototype currently shows", "in this version of the prototype", or "as represented here" — not definitive declarations.
Questions about concept, section purpose, and structural rationale should be answered directly and confidently. Questions about sample data, charts, widgets, labels, copy, or UI/UX details should sound provisional unless the prompt explicitly marks them as firm.
If the user is asking a question about a non-final prototype detail, answer it provisionally. Do not treat that as feedback unless the message also clearly contains feedback intent.
Do NOT volunteer caveats about the prototype being incomplete. Just avoid sounding final about implementation details, so stakeholders focus on the overall model rather than fixating on specifics that are expected to change.

Below is a complete description of everything implemented in the clickable prototype.

NAVIGATION AND LAYOUT
- The sidebar contains navigation icons: Inbox, Pipeline, AI & Automation, Analytics, Broadcast, Settings. The bottom of the sidebar has Voice, Support, and Notifications icons. Only Analytics is functional; the rest are visual placeholders.
- The Settings cog opens a popout with local prototype controls:
  - Role: Admin, Supervisor (default), or Agent — filters the analytics perspective
  - Teams: opens a team manager where session team names and team focus can be edited
  - Reset All: resets the dashboard prototype state to its default configuration
- During AI onboarding, the Settings cog remains visible but is temporarily locked until onboarding is finished.

AI SETUP ASSISTANT
- The prototype can include an AI setup assistant for configuration.
- When available, it can open after the walkthrough and starts with two setup choices: which customer profile to use and which role to impersonate.
- It can gather context from customer profiles, website URLs, uploaded files, and pasted text.
- Its goal is to understand the customer well enough to propose an initial dashboard structure, including tab names/order and starter widgets.
- During onboarding it appears as a full-screen assistant flow with a chat area and a live preview.
- After onboarding, it collapses into a smaller Analytics Assistant that remains available for further configuration help.

FILTERS
- Date filter: Today, Last 7 days, Last 14 days, Last 30 days (default), Last 90 days
- Channel filter: All channels (default), with grouped channel types such as Email, Live chat, Social, and Voice, plus nested channel choices inside the dropdown
- Team filter: All teams (default), plus the currently configured team names from the active team setup. Editing teams updates this dropdown.
- Changing filters re-renders sections. All data in the prototype is randomly generated mock data, so filter changes produce new random values.

ROLE AND TEAM-FOCUS FILTERING
The analytics model still uses four widget states internally: support_supervisor, support_agent, sales_supervisor, sales_agent. The visible role selector offers Admin, Supervisor, and Agent. Supervisor and Agent change the rendered dashboard perspective directly. Admin is an impersonation/configuration role and currently previews the supervisor perspective. A selected team can also push the view toward Resolve or Convert based on that team's configured focus. Each widget can be configured per state to:
- show: make visible
- hide: remove from view
- emphasize: visually highlight as high-priority
- deemphasize: visually mute as lower-priority
State overrides take precedence over base visibility. This means a widget listed as "always visible" can still be hidden in specific states (e.g., Entry channels is always visible by default but hidden for agent roles).
Some widgets also change their sub-label (scopeLabel) and tooltip text depending on the active state.
Additionally, widgets marked "Voice channel only" in the widget lists below are only visible when the channel filter is set to Phone. They are hidden by default under "All channels" and only appear when the voice channel is explicitly selected.

VIEW / EDIT MODE
The prototype defaults to View mode. A toggle in the sub-navigation switches between View and Edit. In View mode the dashboard is read-only. In Edit mode users can drag-reorder widgets, resize them, hide them, and manage tabs (create, rename, delete pages).

WIDGET INTERACTIONS
All drag, resize, and hide interactions below require Edit mode to be enabled.
- Drag and drop: Widgets can be reordered by dragging the 6-dot handle in the top-left corner.
- Resize: Widgets can be resized by dragging the corner handle. Snap points show available widths (25%, 33%, 50%, 66%, 75%, 100%).
- Hide: Widgets (except "always visible" ones) can be hidden via the X button.
- Tooltips: Hovering the (i) icon shows context-sensitive help text.
- Drill links: Some widgets have links like "See why" or "Improve this" that navigate to related sections.
- Expand/collapse: List-type widgets have "Show more" / "Show less" buttons.
- CSV download: Chart widgets have a download button that exports the chart data as a .csv file.

WIDGET DRAWER (MANAGE WIDGETS SIDEBAR)
- Opened by clicking "Manage widgets" in the top bar, "+ Add widgets" on an empty tile, or "+ Manage widgets" on a new empty page.
- Shows all available widgets from all five sections (Overview, Understand, Operate, Improve, Automate) with their status relative to the current page: "On this page", "Not on this page", "Not available in this view", or "Not available with current filter".
- Users can add any widget from any section to the current page, or hide widgets already on it. Adding a widget to one page does not affect other pages.
- Includes a category filter (All, Overview, Understand, Operate, Improve, Automate) and a sort option (Default, Name A-Z, Name Z-A, Visible first).
- Includes a search field to filter widgets by name.

CUSTOM PAGES AND TAB MANAGEMENT
- The prototype defaults to five tabs: Overview, Understand, Operate, Improve, Automate. These correspond to the five core sections.
- In edit mode, users can create new custom pages by clicking the "+" button next to the tab bar.
- New custom pages start empty with a prompt to add widgets. Users can then add any widget from any of the five sections to build a personalised page.
- Each page maintains its own independent set of widgets. Adding or removing a widget on one page does not affect any other page.
- Pages can be renamed by clicking the pencil icon next to the page heading in edit mode, typing a new name, and clicking Save.
- Pages can be deleted via the same pencil menu, which shows a "Delete page" button. Deleting a page requires confirmation. At least one page must remain.
- In this version of the prototype, the five default pages are the starting set rather than locked tabs. Default and custom pages both use the same rename and delete controls, as long as at least one page remains.
- This allows users to create focused views (e.g., a "My Dashboard" page with selected KPIs from across all sections) without disrupting the standard five-section structure.

CURRENT REPORTING CONTINUITY NOTES
- If asked how this differs from the current Live Dashboard concept, answer at the structural level: this model reorganises reporting around stable operational questions rather than around fragmented dashboard surfaces. Do not speculate about product rollout or product-surface replacement.
- If asked whether ticket-detail deep dives still have a role, answer that they may still support investigation, but they are not the organising structure of this model. The model is about system-level interpretation first, not removing all deeper inspection.
- If asked why restoring the default baseline matters in stakeholder review sessions, answer that it brings the prototype back to the shared reference state so stakeholders evaluate the intended concept rather than a previously customised view.
- If asked how stakeholders should think about CSV exports in this concept, answer generically: exportability should still exist in the real product, even if the main reporting surface is reorganised around the watchtower model. Exports are an output capability, not the organising logic.

GUIDED WALKTHROUGH
On first visit, a multi-step walkthrough introduces the prototype. It covers the five-section model, ProtoGuide (the companion panel), the settings popout, and how to customise widgets in edit mode. The walkthrough can be dismissed and reset from the feature flags popout. If the AI setup assistant is available, it can open after the walkthrough.

CHART TYPES USED
- KPI cards: Large number with trend indicator (up/down percentage) and sub-label
- KPI groups: Multiple KPIs side-by-side (e.g., CSAT Breakdown)
- Bar charts: Horizontal or vertical bars (e.g., tickets by hour, entry channels, intent clusters, bottlenecks, handoff reasons)
- Line charts: Trend lines over time (e.g., tickets created, intent trends, created vs closed, capacity vs demand, satisfaction score)
- Doughnut chart: Circular proportion chart (e.g., new vs returning contacts)
- Progress bars: Percentage with color-coded fill — green >=80%, orange >=60%, red <60% (e.g., SLA compliance, journeys success ratio)
- Tables: Multi-column data grids (e.g., workload by agent)
- Lists: Label + value + trend rows (e.g., intent highlights, exceptions, emerging intents)
- Lists with actions: Rows with Approve/Reject buttons (e.g., suggested knowledge additions)
- Opportunities backlog: Special table with impact badges, owner, status, and Dismiss/Action buttons
- Funnel charts: Stage-based conversion funnel (e.g., sales pipeline funnel)
- Agent status: Real-time agent availability display (e.g., agent online status)
- Stacked bar charts: Bars segmented by category (e.g., leads or deals by channel)

OVERVIEW SECTION WIDGETS
- Open tickets (KPI, always visible) — Total open tickets. Supervisor: "Across all channels". Agent: "Your open tickets". In sales mode, tooltip changes to reference open contacts and pipeline.
- Assigned tickets (KPI, default) — Currently assigned tickets. Shown in all states including sales.
- First response time (KPI, default) — Median time to first reply. De-emphasized in sales mode. Supervisor: "Median — all agents". Agent: "Your median".
- Resolution time (KPI, default) — Median resolution time. Hidden in sales mode.
- Tickets created by hour (bar chart, default) — 24-hour distribution. Hidden for agents.
- Escalation rate AI to human (KPI, default) — Percentage of AI tickets escalated. Hidden for agents.
- Intent trend highlights (list, default) — Top rising/declining intents. Hidden for agents, emphasized for sales supervisors. Has drill link to Understand section.
- Knowledge gap alerts (KPI, hidden) — Count of unresolved AI fallback cases. Hidden in all states. Has drill link to Improve section.
- Exceptions requiring attention (list, hidden) — System-detected anomalies. Hidden for agents. Has drill link to Automate section.
- Pipeline value (KPI, default) — Total value of all open deals. Hidden for support roles.
- Win rate (KPI, default) — Percentage of opportunities resulting in a closed-won deal. Hidden for support roles.
- Avg deal size (KPI, default) — Average value per deal. Hidden for support roles.
- Avg sales cycle (KPI, default) — Average days from lead to close. Hidden for support roles.
- Missed calls (KPI, default) — Calls that rang without being answered. Voice channel only.
- Total calls (KPI, default) — Total calls handled across all voice channels. Voice channel only.
- Calls by hour of day (bar chart, default) — Hourly call volume distribution. Voice channel only.

UNDERSTAND SECTION WIDGETS
- Tickets created (line chart, always visible) — Trend over time. De-emphasized for sales supervisors, hidden for sales agents.
- Entry channels (bar chart, always visible) — Distribution by channel. Hidden for agents. Tooltip changes for sales roles to reference contacts and pipeline entries.
- New vs returning contacts (doughnut chart, default) — 62%/38% split. Emphasized for sales supervisors.
- Intent clusters (bar chart, default) — Top customer intents by AI classification. Hidden for agents, emphasized for sales supervisors.
- Intent trends over time (line chart, default) — How intents change. Hidden for agents.
- Emerging intents (list, hidden) — New or growing intent clusters. Hidden for agents.
- Unknown/unclassified intents (KPI, default) — Tickets AI could not classify. Hidden for agents and sales supervisors.
- Escalations by intent (bar chart, hidden) — Which intents cause most escalations. Hidden in all states.
- New leads (stacked bar chart, default) — Leads by channel over 7 days. Hidden for support roles.
- Deals created (stacked bar chart, default) — Deals created by channel over 7 days. Hidden for support roles.
- Sales pipeline funnel (funnel chart, default) — Five-stage funnel: New to Qualified to Proposal to Negotiation to Closed Won. Hidden for support roles.
- Deals closed by channel (doughnut chart, default) — Won deals broken down by channel. Hidden for support roles.
- Deals created by channel (doughnut chart, default) — Deal creation volume by channel. Hidden for support roles.
- Inbound vs outbound calls (bar chart, default) — Call volume split by direction. Voice channel only.
- Duration: inbound vs outbound (bar chart, default) — Average call duration by direction. Voice channel only.
- Voice channel performance (table, default) — Per-channel metrics: total calls, missed calls, avg wait, avg duration, answer rate. Voice channel only.

OPERATE SECTION WIDGETS
- First response time (KPI, always visible) — Same metric as Overview but in operational context. De-emphasized in sales. Supervisor: "Median — all agents". Agent: "Your median".
- Resolution time tickets (KPI, always visible) — Median resolution. Hidden in sales.
- Created vs Closed tickets (line chart, default) — Inflow vs outflow comparison. Hidden for agents and sales.
- Reopened tickets (KPI, default) — Tickets reopened after resolution. Hidden in sales. Supervisor: "Reopened this period". Agent: "Your reopened tickets".
- Workload by agent (table, default) — Per-agent metrics table. Hidden for agents and sales.
- SLA compliance (progress bar, default) — Percentage within SLA. Hidden in sales.
- Bottlenecks (bar chart, always visible) — Shows where work is accumulating or getting stuck. Only visible for support supervisors.
- Capacity vs demand (line chart, hidden) — Incoming work vs agent capacity. Hidden for agents.
- Performance by channel (table, default) — Key metrics broken down by channel. Hidden for agents.
- Sales performance (table, default) — Per-agent table with Leads, Deals, Pipeline value, Revenue, Win rate. Hidden for support roles.
- Channel x stage matrix (table, default) — Deals by channel across pipeline stages. Hidden for support roles.
- Time to answer (KPI, default) — Average time before a call is answered. Voice channel only.
- Call duration (KPI group, default) — Average, longest, and shortest call durations. Voice channel only.
- Calls by team (bar chart, default) — Call volume split by team. Voice channel only.
- Avg wait time by team (bar chart, default) — Average caller wait time per team. Voice channel only.
- Longest wait time (KPI, default) — Peak wait time in the period. Voice channel only.
- Call duration by team (bar chart, default) — Average call length per team. Voice channel only.
- Call abandonment trend (line chart, default) — Abandonment rate over time. Voice channel only.
- Callback requests (KPI, default) — Number of callback requests received. Voice channel only.
- Agent online status (agent status, default) — Real-time agent availability. Voice channel only.

IMPROVE SECTION WIDGETS
- CSAT score (KPI, always visible) — Customer satisfaction score. Hidden in sales.
- Response rate (KPI, always visible) — Survey response percentage. Hidden in sales.
- CSAT Breakdown (KPI group, default) — Sentiment breakdown. Hidden in sales.
- Satisfaction score (line chart, default) — CSAT trend over time. Hidden for agents and sales.
- Surveys received (bar chart, default) — Daily survey count. Hidden for agents and sales.
- Reopen rate (KPI, default) — Percentage of resolved tickets reopened. Shown in all states.
- Knowledge gaps by intent (bar chart, hidden) — Intents with most knowledge gaps. Hidden for sales supervisors.
- Suggested knowledge additions (list with actions, default) — AI-suggested articles with Approve/Reject buttons. Hidden for agents.
- Opportunities backlog (opportunities widget, always visible) — 15 prioritised improvement opportunities with impact, owner, and status. Hidden for agents.
- First call resolution (KPI, default) — Percentage of calls resolved without follow-up. Voice channel only.
- Call-to-ticket rate (KPI, default) — Percentage of calls that generate a ticket. Voice channel only.

AUTOMATE SECTION WIDGETS
- AI Agent tickets (KPI, always visible) — Total AI-handled tickets.
- Resolution rate AI Agents (KPI, always visible) — Percentage fully resolved by AI. De-emphasized for agents.
- Assistance rate AI Agents (KPI, default) — Percentage where AI assisted but did not fully resolve. Shown for agents.
- Open ticket rate AI Agents (KPI, default) — Percentage of AI tickets still open. Hidden for agents.
- Journeys success ratio (progress bar, default) — Percentage of automation journeys completing successfully. Hidden for agents, emphasized for sales supervisors.
- Journeys escalations (KPI, default) — Journeys that escalated to human. Hidden for agents.
- Automation handoff reasons (bar chart, default) — Why automation handed off. Hidden for agents.
- Automation conflicts (list, hidden) — Conflicting actions between journeys and AI agents. Hidden for agents.
- Safety and guardrail violations (list, hidden) — Safety guardrail stops in automation. Hidden for agents.
- Time in IVR / queue (KPI, default) — Average time callers spend in IVR or queue. Voice channel only.

MOCK DATA
All data in the prototype is randomly generated on each page load. KPI values, chart data, trend percentages, and table rows use random numbers within configured ranges. The data is not real and is only meant to illustrate the layout and structure. Changing filters or switching roles produces new random values.`;

  // ── State ──────────────────────────────────────────────────
  let sessionUserName = null;
  let pendingFeedback = null;
  const messages = []; // conversation history for API

  // ── Action Log (weighted, for feedback/bug context) ──────────
  const actionLog = [];
  const ACTION_WEIGHT_MAP = { navigate: 5, setting_change: 5, form_submit: 5, click: 3, selection: 3, hover_data: 1, scroll: 1, event: 2 };
  const ACTION_WEIGHT_LIMIT = 150;
  let actionWeightTotal = 0;

  function logAction(action) {
    const weight = ACTION_WEIGHT_MAP[action.type] || 2;
    actionLog.push({ ...action, weight, timestamp: action.timestamp || Date.now() });
    actionWeightTotal += weight;
    while (actionWeightTotal > ACTION_WEIGHT_LIMIT && actionLog.length > 1) {
      const removed = actionLog.shift();
      actionWeightTotal -= removed.weight;
    }
  }

  function getRecentActions() {
    return actionLog.map(a => ({
      type: a.type,
      detail: a.detail,
      element: a.element,
      timestamp: a.timestamp
    }));
  }

  // ── Prototype view tracking (for feedback/bug context) ────────
  let _lastPrototypeView = '';
  let _lastPrototypeTitle = '';

  // ── Element references ─────────────────────────────────────
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const insightsBtn = document.getElementById('open-insights-btn');

  const settingsBtn = document.getElementById('open-settings-btn');
  const feedbackBtn = document.getElementById('open-feedback-btn');
  const bugBtn = document.getElementById('open-bug-btn');
  const chatInputActions = document.getElementById('chat-input-actions');
  const aiPanel = document.getElementById('ai-panel');
  const panelHeader = document.querySelector('.ai-panel-header');
  const userMenuBtn = document.getElementById('ai-panel-user-menu-btn');
  const userMenuPopover = document.getElementById('user-menu-popover');
  const userMenuEmail = document.getElementById('user-menu-email');

  const expandFromBarBtn = document.getElementById('ai-panel-expand-from-bar');
  const expandBtn = document.getElementById('ai-panel-expand');
  const closeBtn = document.getElementById('ai-panel-close');
  const iconExpand = document.getElementById('ai-icon-expand');
  const iconCompress = document.getElementById('ai-icon-compress');
  let activeTooltipTrigger = null;
  let tooltipMeasure = null;

  function ensureTooltipMeasure() {
    if (tooltipMeasure) return tooltipMeasure;
    tooltipMeasure = document.createElement('span');
    tooltipMeasure.className = 'ai-panel-tooltip-measure';
    document.body.appendChild(tooltipMeasure);
    return tooltipMeasure;
  }

  function getTooltipBoundary(trigger) {
    return trigger.closest('.ai-panel-inner')
      || trigger.closest('.ai-panel-bar')
      || trigger.closest('.ai-panel');
  }

  function clearTooltipPosition(trigger) {
    if (!trigger) return;
    trigger.style.removeProperty('--tooltip-shift');
  }

  function positionTooltip(trigger) {
    if (!trigger || !trigger.isConnected) return;

    const text = trigger.getAttribute('data-tooltip');
    const boundary = getTooltipBoundary(trigger);
    const measure = ensureTooltipMeasure();
    if (!text || !boundary || !measure) {
      clearTooltipPosition(trigger);
      return;
    }

    measure.textContent = text;

    const tooltipWidth = measure.getBoundingClientRect().width;
    const triggerRect = trigger.getBoundingClientRect();
    const boundaryRect = boundary.getBoundingClientRect();
    const gutter = 10;
    const tooltipLeft = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
    const tooltipRight = tooltipLeft + tooltipWidth;
    const minLeft = boundaryRect.left + gutter;
    const maxRight = boundaryRect.right - gutter;
    let shift = 0;

    if (tooltipLeft < minLeft) {
      shift = minLeft - tooltipLeft;
    } else if (tooltipRight > maxRight) {
      shift = maxRight - tooltipRight;
    }

    trigger.style.setProperty('--tooltip-shift', Math.round(shift) + 'px');
  }

  function activateTooltip(trigger) {
    activeTooltipTrigger = trigger;
    positionTooltip(trigger);
  }

  function deactivateTooltip(trigger) {
    if (activeTooltipTrigger === trigger) activeTooltipTrigger = null;
    clearTooltipPosition(trigger);
  }

  if (aiPanel) {
    aiPanel.querySelectorAll('[data-tooltip]').forEach(function (trigger) {
      trigger.addEventListener('mouseenter', function () {
        activateTooltip(trigger);
      });
      trigger.addEventListener('mouseleave', function () {
        deactivateTooltip(trigger);
      });
      trigger.addEventListener('focus', function () {
        activateTooltip(trigger);
      });
      trigger.addEventListener('blur', function () {
        deactivateTooltip(trigger);
      });
    });

    aiPanel.addEventListener('transitionend', function (event) {
      if (event.propertyName === 'width' && activeTooltipTrigger) {
        positionTooltip(activeTooltipTrigger);
      }
    });
  }

  window.addEventListener('resize', function () {
    if (activeTooltipTrigger) positionTooltip(activeTooltipTrigger);
  });

  // ── Panel state machine ────────────────────────────────────
  // States: 'bar' (48px) | 'chat' (280px, default) | 'wide' (405px)

  function setPanelState(state) {
    document.body.dataset.panel = state;

    if (state === 'chat') {
      if (iconExpand) iconExpand.style.display = '';
      if (iconCompress) iconCompress.style.display = 'none';
      expandBtn.setAttribute('aria-label', 'Expand to wide');
      expandBtn.setAttribute('data-tooltip', 'Expand to wide');
    } else if (state === 'wide') {
      if (iconExpand) iconExpand.style.display = 'none';
      if (iconCompress) iconCompress.style.display = '';
      expandBtn.setAttribute('aria-label', 'Reduce to chat');
      expandBtn.setAttribute('data-tooltip', 'Reduce to chat');
    }

    // Clear event popups when the panel opens
    if (state === 'chat' || state === 'wide') {
      const popupContainer = document.getElementById('chat-popup-container');
      if (popupContainer) popupContainer.innerHTML = '';
    }

    // Focus input when panel is open
    if (state === 'chat' || state === 'wide') {
      setTimeout(() => chatInput.focus(), 120);
    }

    if (activeTooltipTrigger) {
      requestAnimationFrame(function () {
        positionTooltip(activeTooltipTrigger);
      });
    }
  }

  // ── Panel button listeners ─────────────────────────────────
  expandFromBarBtn.addEventListener('click', () => setPanelState('chat'));
  closeBtn.addEventListener('click', () => setPanelState('bar'));
  expandBtn.addEventListener('click', () => {
    setPanelState(document.body.dataset.panel === 'wide' ? 'chat' : 'wide');
  });

  // ── Chat UI ────────────────────────────────────────────────

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderBotMessage(text) {
    const lines = text.split('\n');

    // Detect feedback-format bullets: "• Section — text..."
    const feedbackBulletRe = /^• [A-Za-z][\w\s]+ — .+/;
    const feedbackLines = lines.filter(l => feedbackBulletRe.test(l.trim()));

    if (feedbackLines.length > 3) {
      const sectionRe = /^• ([^—]+) — /;
      const groups = new Map();
      feedbackLines.forEach(line => {
        const m = line.trim().match(sectionRe);
        const section = m ? m[1].trim() : 'General';
        if (!groups.has(section)) groups.set(section, []);
        groups.get(section).push(line.trim());
      });

      let html = '';
      groups.forEach((items, section) => {
        html += '<strong>' + escapeHtml(section) + '</strong>';
        html += items.map(escapeHtml).join('\n\n');
      });
      return html;
    }

    // Default: support ## headers, preserve newlines via pre-wrap
    return lines.map((line, i, arr) => {
      const trimmed = line.trim();
      const isLast = i === arr.length - 1;
      if (trimmed.startsWith('## ')) {
        return '<strong>' + escapeHtml(trimmed.slice(3).trim()) + '</strong>';
      }
      return escapeHtml(line) + (isLast ? '' : '\n');
    }).join('');
  }

  function addBubble(text, role) {
    const div = document.createElement('div');
    div.className = 'chat-bubble ' + (role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot');
    if (role === 'user') {
      div.textContent = text;
    } else {
      div.innerHTML = renderBotMessage(text);
    }
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
  }

  function addErrorBubble(text) {
    const div = document.createElement('div');
    div.className = 'chat-error';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Build a friendly error message from an API response.
   */
  async function friendlyApiError(resp) {
    let errMsg = '';
    let code = resp.status;
    try {
      const body = await resp.json();
      errMsg = (body && body.error) || '';
    } catch (_) {}

    if (code === 429) {
      return 'The AI service is currently rate-limited. Try again in a moment. (Error ' + code + (errMsg ? ': ' + errMsg : '') + ')';
    }
    if (code === 529 || code === 503) {
      return 'The AI service appears to be temporarily down. Try again later. (Error ' + code + (errMsg ? ': ' + errMsg : '') + ')';
    }
    if (code >= 500) {
      return 'Something went wrong on the server side. If this persists, contact your admin. (Error ' + code + (errMsg ? ': ' + errMsg : '') + ')';
    }
    if (code === 400 || code === 422) {
      return 'There seems to be a configuration issue with the AI integration. Consider contacting your admin. (Error ' + code + (errMsg ? ': ' + errMsg : '') + ')';
    }
    if (code === 401 || code === 403) {
      return 'Authentication issue — try refreshing the page or signing in again. (Error ' + code + (errMsg ? ': ' + errMsg : '') + ')';
    }
    return 'Something went wrong. Please try again. (Error ' + code + (errMsg ? ': ' + errMsg : '') + ')';
  }

  function addEventBubble(label) {
    const div = document.createElement('div');
    div.className = 'chat-bubble-event';
    div.innerHTML = '<span class="chat-bubble-event-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>' + escapeHtml(label);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'chat-typing-indicator';
    div.innerHTML = '<div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div>';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
  }

  // ── Event popups ───────────────────────────────────────────
  let _eventTimer = null;
  const MAX_POPUPS = 2;

  function showEventPopup(text) {
    const container = document.getElementById('chat-popup-container');
    if (!container) return;

    // Limit to MAX_POPUPS
    while (container.children.length >= MAX_POPUPS) {
      container.removeChild(container.lastChild);
    }

    const popup = document.createElement('div');
    popup.className = 'chat-popup';
    popup.innerHTML = renderBotMessage(text);

    // Close button
    const closePopupBtn = document.createElement('button');
    closePopupBtn.className = 'chat-popup-close';
    closePopupBtn.innerHTML = '&times;';
    closePopupBtn.addEventListener('click', () => {
      popup.classList.add('fading');
      setTimeout(() => popup.remove(), 300);
    });
    popup.prepend(closePopupBtn);

    container.prepend(popup);

    // Auto-fade after 10s
    setTimeout(() => {
      popup.classList.add('fading');
      setTimeout(() => popup.remove(), 5000);
    }, 10000);
  }

  // ── Sentinel parsing ───────────────────────────────────────

  function parseSentinels(text) {
    let feedback = null;
    let clean = text;

    const fbMatch = clean.match(/<<FEEDBACK:(\{[\s\S]*?\})>>/);
    if (fbMatch) {
      try { feedback = JSON.parse(fbMatch[1]); } catch (e) {}
      clean = clean.replace(fbMatch[0], '').trim();
    }

    return { cleanText: clean, feedback: feedback };
  }

  // ── Name heuristic ─────────────────────────────────────────

  function looksLikeName(text) {
    var t = text.trim();
    if (!t || t.length > 50 || t.includes('?')) return false;
    var words = t.split(/\s+/);
    if (words.length > 5) return false;
    if (words.some(function (w) { return w.length > 20; })) return false;
    return true;
  }

  // ── Feedback helpers ───────────────────────────────────────

  function formatFeedbackBlock(items) {
    if (!items.length) return '';
    const lines = items.map(f => {
      const nameStr = f.name ? ` (from ${f.name})` : '';
      return '\u2022 ' + (f.section || 'General') + ' \u2014 ' + f.text + nameStr;
    }).join('\n');
    return '----------------------------------------------------------------------\nFEEDBACK_DATA\n----------------------------------------------------------------------\n' + lines;
  }

  async function storeFeedback(feedbackObj) {
    try {
      const resp = await fetch(CHATBOT_PROXY + '/protoguide/feedback', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: feedbackObj.text,
          section: feedbackObj.section || 'General',
          type: feedbackObj.type || 'product',
          submitterName: feedbackObj.name || sessionUserName || undefined
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.id;
      }
    } catch (e) {
      console.error('Failed to store feedback:', e);
    }
    return null;
  }

  async function updateFeedback(feedbackId, updates) {
    if (!feedbackId) return;
    try {
      await fetch(CHATBOT_PROXY + '/protoguide/feedback/' + feedbackId, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error('Failed to update feedback:', e);
    }
  }

  async function fetchFeedback() {
    try {
      const resp = await fetch(CHATBOT_PROXY + '/protoguide/feedback', { headers: getAuthHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        return data.submissions || [];
      }
    } catch (e) {
      console.error('Failed to fetch feedback:', e);
    }
    return [];
  }

  // ── Tool Component Renderers ──────────────────────────────

  /**
   * Router: dispatch to a specific renderer based on tool name.
   */
  function renderToolComponent(toolUse, fullResponse) {
    if (!toolUse || !toolUse.name) return;
    switch (toolUse.name) {
      case 'show_choices':
        renderShowChoices(toolUse, fullResponse);
        break;
      case 'submit_feedback':
        renderFeedbackBug(toolUse, fullResponse, 'feedback');
        break;
      case 'report_bug':
        renderFeedbackBug(toolUse, fullResponse, 'bug');
        break;
      default:
        // Unknown tool — silently ignore to avoid crashes
        console.warn('[ProtoGuide] Unknown tool_use name:', toolUse.name);
        break;
    }
  }

  /**
   * Render choice pills for show_choices tool.
   */
  function renderShowChoices(toolUse, fullResponse) {
    const input = toolUse.input || {};
    // Filter out any "Other" option the AI may have included — the code adds its own when allow_other is true
    const rawOptions = Array.isArray(input.options) ? input.options : [];
    const options = input.allow_other
      ? rawOptions.filter(opt => {
          if (!opt) return false;
          const label = (opt.label || opt.id || '').toLowerCase().replace(/[.\u2026]+$/, '').trim();
          return label !== 'other';
        })
      : rawOptions;
    const container = document.createElement('div');
    container.className = 'chat-tool-component';

    // Optional prompt text
    if (input.prompt) {
      const promptEl = document.createElement('div');
      promptEl.className = 'chat-tool-prompt';
      promptEl.textContent = input.prompt;
      container.appendChild(promptEl);
    }

    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'chat-pills';

    options.forEach(function (opt) {
      if (!opt) return;
      const btn = document.createElement('button');
      btn.className = 'chat-pill';
      btn.textContent = opt.label || opt.id || '';
      btn.addEventListener('click', function () {
        if (container.classList.contains('resolved')) return;
        btn.classList.add('selected');
        container.classList.add('resolved');
        handleToolResult(toolUse, fullResponse, {
          selected: [opt.id],
          selectedLabels: [opt.label || opt.id || '']
        });
      });
      pillsWrap.appendChild(btn);
    });

    // "Other..." pill — resolves immediately and focuses main input
    if (input.allow_other) {
      const otherBtn = document.createElement('button');
      otherBtn.className = 'chat-pill';
      otherBtn.textContent = 'Other\u2026';
      otherBtn.addEventListener('click', function () {
        if (container.classList.contains('resolved')) return;
        otherBtn.classList.add('selected');
        container.classList.add('resolved');
        handleToolResult(toolUse, fullResponse, {
          selected: ['__other__'],
          selectedLabels: ['Other']
        });
        // Focus the main chat input so the user can type their response there
        chatInput.focus();
      });
      pillsWrap.appendChild(otherBtn);
    }

    container.appendChild(pillsWrap);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Render confirm/decline buttons for feedback and bug tools.
   */
  function renderFeedbackBug(toolUse, fullResponse, type) {
    const input = toolUse.input || {};
    const container = document.createElement('div');
    container.className = 'chat-tool-component';

    // Prompt text
    if (input.prompt) {
      const promptEl = document.createElement('div');
      promptEl.className = 'chat-tool-prompt';
      promptEl.textContent = input.prompt;
      container.appendChild(promptEl);
    }

    const actionsRow = document.createElement('div');
    actionsRow.className = 'chat-tool-actions';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'chat-tool-confirm';
    confirmBtn.textContent = input.confirm_label || 'Confirm';

    const declineBtn = document.createElement('button');
    declineBtn.className = 'chat-tool-decline';
    declineBtn.textContent = input.decline_label || 'Skip';

    confirmBtn.addEventListener('click', function () {
      if (container.classList.contains('resolved')) return;
      confirmBtn.classList.add('selected');
      container.classList.add('resolved');

      handleToolResult(toolUse, fullResponse, {
        confirmed: true,
        actionLog: getRecentActions(),
        type: type,
        inferred_section: input.inferred_section || null,
        inferred_text: input.inferred_text || null
      });
    });

    declineBtn.addEventListener('click', function () {
      if (container.classList.contains('resolved')) return;
      declineBtn.classList.add('selected');
      container.classList.add('resolved');
      handleToolResult(toolUse, fullResponse, { confirmed: false });
    });

    actionsRow.appendChild(confirmBtn);
    actionsRow.appendChild(declineBtn);
    container.appendChild(actionsRow);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ── Client-Side Agentic Loop ────────────────────────────────

  let _agenticLoopDepth = 0;
  const AGENTIC_LOOP_MAX = 5;

  /**
   * Handle a tool_use result: append messages, call API again.
   */
  async function handleToolResult(toolUse, fullResponse, result) {
    if (_agenticLoopDepth >= AGENTIC_LOOP_MAX) {
      addErrorBubble('Too many round-trips. Please try again.');
      _agenticLoopDepth = 0;
      return;
    }

    // Append the AI's full response to messages
    messages.push({ role: 'assistant', content: fullResponse.content });

    // Append the tool result
    messages.push({
      role: 'user',
      content: [{
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result)
      }]
    });

    // Store feedback/bug if confirmed
    if ((toolUse.name === 'submit_feedback' || toolUse.name === 'report_bug') && result.confirmed) {
      const fbType = toolUse.name === 'report_bug' ? 'bug' : 'product';
      storeFeedback({
        text: result.inferred_text || '',
        section: result.inferred_section || 'General',
        type: fbType,
        name: sessionUserName || undefined
      }).then(function (feedbackId) {
        if (!sessionUserName && feedbackId) {
          pendingFeedback = { feedbackId: feedbackId, retries: 0 };
        }
      });
    }

    _agenticLoopDepth++;
    showTyping();

    try {
      const api = window._prototypeGuideAPI;
      const settingsData = api ? api.getSettingsData() : {};
      const currentRole = settingsData.role ? settingsData.role.current : 'supervisor';

      const system = [
        'IDENTITY:\n' + CONTEXT_IDENTITY,
        'DOMAIN KNOWLEDGE:\n' + CONTEXT_DOMAIN,
        CONTEXT_DETAILS ? 'PROTOTYPE DETAILS:\n' + CONTEXT_DETAILS : '',
        'CURRENT STATE:',
        '- Dashboard role: ' + currentRole,
        '- Current view: ' + (_lastPrototypeView || document.title),
        getRecentActions().length ? 'RECENT USER ACTIONS:\n' + getRecentActions().map(a => '- [' + a.type + '] ' + (a.detail || '')).join('\n') : ''
      ].filter(Boolean).join('\n\n');

      const tools = [
        { name: 'show_choices', description: 'Show interactive choice buttons', input_schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] } } }, required: ['items'] } },
        { name: 'submit_feedback', description: 'Collect structured feedback', input_schema: { type: 'object', properties: { section: { type: 'string' }, sentiment: { type: 'string' }, text: { type: 'string' } }, required: ['text'] } },
        { name: 'report_bug', description: 'Collect a bug report', input_schema: { type: 'object', properties: { description: { type: 'string' }, steps: { type: 'string' } }, required: ['description'] } }
      ];

      const resp = await fetch(CHATBOT_PROXY + '/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system, messages, tools })
      });

      removeTyping();

      if (!resp.ok) {
        addErrorBubble(await friendlyApiError(resp));
        _agenticLoopDepth = 0;
        return;
      }

      const data = await resp.json();
      processApiResponse(data);

    } catch (e) {
      removeTyping();
      addErrorBubble('Network error \u2014 please check your connection and try again.');
      console.error('Agentic loop error:', e);
      _agenticLoopDepth = 0;
    }
  }

  /**
   * Process an API response — handles both old (string) and new (array with tool_use) formats.
   */
  function processApiResponse(data) {
    const content = data.content;

    // New format: content is an array of blocks
    if (Array.isArray(content)) {
      let hasToolUse = false;

      function renderBlock(block) {
        if (!block) return;

        if (block.type === 'text' && block.text) {
          // Parse sentinels from text blocks (backward compat)
          const { cleanText, feedback } = parseSentinels(block.text);
          if (cleanText) {
            addBubble(cleanText, 'assistant');
          }
          // Handle sentinels
          if (feedback) {
            storeFeedback({
              text: feedback.text,
              section: feedback.section,
              type: feedback.type,
              name: sessionUserName || undefined
            }).then(function (feedbackId) {
              if (!sessionUserName && feedbackId) {
                pendingFeedback = { feedbackId: feedbackId, retries: 0 };
              }
            });
          }
        } else if (block.type === 'tool_use') {
          hasToolUse = true;
          renderToolComponent(block, data);
        }
      }

      content.forEach(renderBlock);

      // If no tool_use blocks, this is a final response — reset loop depth
      if (!hasToolUse) {
        _agenticLoopDepth = 0;
        // Store the assistant message for text-only responses
        const textParts = content.filter(function (b) { return b && b.type === 'text' && b.text; });
        if (textParts.length > 0) {
          const combinedText = textParts.map(function (b) { return parseSentinels(b.text).cleanText; }).filter(Boolean).join('\n');
          if (combinedText) {
            messages.push({ role: 'assistant', content: combinedText });
          }
        }
      }
      // If there are tool_use blocks, don't push to messages yet —
      // handleToolResult will push the full response content when the user interacts
      return;
    }

    // Old format: content is not an array — extract text the legacy way
    const rawReply = (content && content[0] && content[0].text) || '';
    if (!rawReply && typeof data.reply === 'string') {
      // Fallback for even older format
      handleLegacyTextResponse(data.reply);
      return;
    }
    handleLegacyTextResponse(rawReply);
  }

  /**
   * Handle a plain text response (legacy format or text-only).
   */
  function handleLegacyTextResponse(rawReply) {
    const { cleanText, feedback } = parseSentinels(rawReply);

    if (cleanText) {
      addBubble(cleanText, 'assistant');
      messages.push({ role: 'assistant', content: cleanText });
    }

    if (feedback) {
      storeFeedback({
        text: feedback.text,
        section: feedback.section,
        type: feedback.type,
        name: sessionUserName || undefined
      }).then(function (feedbackId) {
        if (!sessionUserName && feedbackId) {
          pendingFeedback = { feedbackId: feedbackId, retries: 0 };
        }
      });
    }

    _agenticLoopDepth = 0;
  }

  // ── Send message ───────────────────────────────────────────

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    adjustChatInputHeight();
    addBubble(text, 'user');
    messages.push({ role: 'user', content: text });

    // Handle pending feedback name collection
    if (pendingFeedback) {
      if (looksLikeName(text)) {
        sessionUserName = text.trim();
        await updateFeedback(pendingFeedback.feedbackId, { submitterName: sessionUserName });
        addBubble('Thanks, ' + sessionUserName + '!', 'assistant');
        messages.push({ role: 'assistant', content: 'Thanks, ' + sessionUserName + '!' });
        pendingFeedback = null;
        return;
      } else if (pendingFeedback.retries < 1) {
        pendingFeedback.retries++;
        // Let the message go through to the AI — NAME_RETRY_PENDING will trigger re-ask
      } else {
        pendingFeedback = null; // Give up after 1 retry
      }
    }

    showTyping();

    try {
      const api = window._prototypeGuideAPI;
      const settingsData = api ? api.getSettingsData() : {};
      const currentRole = settingsData.role ? settingsData.role.current : 'supervisor';

      const system = [
        'IDENTITY:\n' + CONTEXT_IDENTITY,
        'DOMAIN KNOWLEDGE:\n' + CONTEXT_DOMAIN,
        CONTEXT_DETAILS ? 'PROTOTYPE DETAILS:\n' + CONTEXT_DETAILS : '',
        'CURRENT STATE:',
        '- Dashboard role: ' + currentRole,
        '- Current view: ' + (_lastPrototypeView || document.title),
        getRecentActions().length ? 'RECENT USER ACTIONS:\n' + getRecentActions().map(a => '- [' + a.type + '] ' + (a.detail || '')).join('\n') : ''
      ].filter(Boolean).join('\n\n');

      const tools = [
        { name: 'show_choices', description: 'Show interactive choice buttons', input_schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] } } }, required: ['items'] } },
        { name: 'submit_feedback', description: 'Collect structured feedback', input_schema: { type: 'object', properties: { section: { type: 'string' }, sentiment: { type: 'string' }, text: { type: 'string' } }, required: ['text'] } },
        { name: 'report_bug', description: 'Collect a bug report', input_schema: { type: 'object', properties: { description: { type: 'string' }, steps: { type: 'string' } }, required: ['description'] } }
      ];

      const resp = await fetch(CHATBOT_PROXY + '/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system, messages, tools })
      });

      removeTyping();
      if (!resp.ok) { addErrorBubble('Something went wrong. Please try again.'); return; }
      const data = await resp.json();

      // Process response — handle text + tool_use blocks
      _agenticLoopDepth = 0; // reset for fresh user message
      processApiResponse(data);
    } catch (e) {
      removeTyping();
      addErrorBubble('Network error. Please check your connection.');
    }
  }

  function adjustChatInputHeight() {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
  }

  // ── Chat input listeners ───────────────────────────────────

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chatInput.addEventListener('input', adjustChatInputHeight);

  // Toggle send button active state based on input content
  function updateSendButtonState() {
    const hasText = chatInput.value.trim().length > 0;
    chatSend.classList.toggle('active', hasText);
  }
  chatInput.addEventListener('input', updateSendButtonState);
  updateSendButtonState();

  // ── Feedback / Bug input-area buttons ───────────────────────

  async function sendSilentIntent(intentTag) {
    // Include the current prototype view
    let viewContext = '';
    if (_lastPrototypeView) {
      viewContext = '\nCURRENT_VIEW: ' + _lastPrototypeView;
      if (_lastPrototypeTitle) viewContext += ' (' + _lastPrototypeTitle + ')';
    }

    let logContext = '';
    if (actionLog.length > 0) {
      const recentActions = actionLog.slice(-20);
      const topRecent = recentActions.slice(-5);
      const earlier = recentActions.slice(0, -5);
      let parts = [];
      if (earlier.length > 0) {
        parts.push('Earlier actions:\n' + earlier.map(a => '[' + a.type + '] ' + a.detail).join('\n'));
      }
      parts.push('MOST RECENT (weight these most heavily):\n' + topRecent.map(a => '>> [' + a.type + '] ' + a.detail).join('\n'));
      logContext = '\n\nACTION_LOG (most recent user actions in the prototype):\n' + parts.join('\n\n');
    }

    const silentText = intentTag + viewContext + logContext;

    // Add to message history for the AI but do NOT show a user bubble
    messages.push({ role: 'user', content: silentText });

    showTyping();

    try {
      const api = window._prototypeGuideAPI;
      const settingsData = api ? api.getSettingsData() : {};
      const currentRole = settingsData.role ? settingsData.role.current : 'supervisor';

      const system = [
        'IDENTITY:\n' + CONTEXT_IDENTITY,
        'DOMAIN KNOWLEDGE:\n' + CONTEXT_DOMAIN,
        CONTEXT_DETAILS ? 'PROTOTYPE DETAILS:\n' + CONTEXT_DETAILS : '',
        'CURRENT STATE:',
        '- Dashboard role: ' + currentRole,
        '- Current view: ' + (_lastPrototypeView || document.title),
        getRecentActions().length ? 'RECENT USER ACTIONS:\n' + getRecentActions().map(a => '- [' + a.type + '] ' + (a.detail || '')).join('\n') : ''
      ].filter(Boolean).join('\n\n');

      const tools = [
        { name: 'show_choices', description: 'Show interactive choice buttons', input_schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] } } }, required: ['items'] } },
        { name: 'submit_feedback', description: 'Collect structured feedback', input_schema: { type: 'object', properties: { section: { type: 'string' }, sentiment: { type: 'string' }, text: { type: 'string' } }, required: ['text'] } },
        { name: 'report_bug', description: 'Collect a bug report', input_schema: { type: 'object', properties: { description: { type: 'string' }, steps: { type: 'string' } }, required: ['description'] } }
      ];

      const resp = await fetch(CHATBOT_PROXY + '/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system, messages, tools })
      });

      removeTyping();

      if (!resp.ok) {
        addErrorBubble(await friendlyApiError(resp));
        return;
      }

      const data = await resp.json();
      _agenticLoopDepth = 0;
      processApiResponse(data);
    } catch (e) {
      removeTyping();
      addErrorBubble('Network error \u2014 please check your connection and try again.');
      console.error('Chat error:', e);
    }
  }

  if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
      sendSilentIntent('[FEEDBACK_INTENT]');
    });
  }

  if (bugBtn) {
    bugBtn.addEventListener('click', () => {
      sendSilentIntent('[BUG_REPORT_INTENT]');
    });
  }

  // New chat button
  document.getElementById('ai-panel-new-chat').addEventListener('click', async () => {
    messages.length = 0;
    pendingFeedback = null;
    _agenticLoopDepth = 0;
    chatMessages.innerHTML = '';
    addBubble("Hi! I'm ProtoGuide \u2014 ask me anything about this analytics prototype.", 'assistant');
    chatInput.focus();
  });

  // ── User menu (cog) ───────────────────────────────────────

  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      var isOpen = userMenuPopover.style.display !== 'none';
      userMenuPopover.style.display = isOpen ? 'none' : '';
    });
  }

  // Close popover on outside click
  document.addEventListener('click', (e) => {
    if (userMenuPopover && userMenuPopover.style.display !== 'none' &&
        !userMenuPopover.contains(e.target) && !userMenuBtn.contains(e.target)) {
      userMenuPopover.style.display = 'none';
    }
  });

  // Sign out from user menu
  var userMenuSignout = document.getElementById('user-menu-signout');
  if (userMenuSignout) {
    userMenuSignout.addEventListener('click', () => {
      if (userMenuPopover) userMenuPopover.style.display = 'none';
      localStorage.removeItem('protoguide_user');
      localStorage.removeItem('protoguide_token');
      window.location.href = 'protoguide-login.html';
    });
  }

  // Reset prototype from user menu
  var userMenuReset = document.getElementById('user-menu-reset');
  if (userMenuReset) {
    userMenuReset.addEventListener('click', () => {
      if (userMenuPopover) userMenuPopover.style.display = 'none';
      if (window.performResetAll) window.performResetAll();
      // Clear chat
      messages.length = 0;
      pendingFeedback = null;
      _agenticLoopDepth = 0;
      chatMessages.innerHTML = '';
      addBubble("Hi! I'm ProtoGuide \u2014 ask me anything about this analytics prototype.", 'assistant');
    });
  }

  // ── updateSettingsRow ──────────────────────────────────────

  function updateSettingsRow() {
    var settingsRowEl = document.getElementById('ai-panel-settings-row');

    // Viewer: hide entire settings row (same as original SideCar guest role)
    if (!currentUser || !hasMinRole(currentUser.role, 'admin')) {
      if (settingsRowEl) settingsRowEl.style.display = 'none';
      if (chatInputActions) chatInputActions.style.display = '';
      if (userMenuBtn) userMenuBtn.style.display = currentUser ? '' : 'none';
      syncChatInputState(true);
      return;
    }

    // Admin: show insights + settings icons
    if (settingsRowEl) settingsRowEl.style.display = '';
    if (insightsBtn) insightsBtn.style.display = '';
    if (settingsBtn) settingsBtn.style.display = '';
    if (chatInputActions) chatInputActions.style.display = '';
    if (userMenuBtn) userMenuBtn.style.display = 'none'; // user menu in settings overlay instead
    syncChatInputState(true);
  }

  function syncChatInputState(enabled) {
    if (chatInput) {
      chatInput.disabled = !enabled;
      if (enabled) {
        chatInput.placeholder = 'Type a message...';
        chatInput.closest('.ai-panel-input-bar')?.classList.remove('disabled');
      } else {
        chatInput.placeholder = '';
        chatInput.closest('.ai-panel-input-bar')?.classList.add('disabled');
      }
    }
    if (chatSend) chatSend.disabled = !enabled;
  }

  // ── postToPrototype — Direct API Calls ─────────────────────

  function postToPrototype(msg) {
    const api = window._prototypeGuideAPI;
    if (!api) return;
    if (msg.type === 'guide:set-role') api.setRole(msg.role);
    else if (msg.type === 'guide:set-flag') api.setFlag(msg.flagId, msg.value);
    else if (msg.type === 'guide:set-toggle') api.setToggle(msg.key, msg.checked);
    else if (msg.type === 'guide:set-slider') api.setSlider(msg.key, msg.value);
  }

  // ── Overlays (settings, insights — rendered inside guide panel) ─
  const settingsOverlay = document.getElementById('settings-overlay');
  const insightsOverlay = document.getElementById('insights-overlay');
  const inputBar = document.querySelector('.ai-panel-input-bar');
  const allOverlays = [settingsOverlay, insightsOverlay];
  let _previousPanelState = null;

  function openGuideOverlay(overlay) {
    document.body.classList.remove('guide-insights-open');

    // Close any other overlays
    allOverlays.forEach(o => { if (o) o.style.display = 'none'; });

    if (overlay === insightsOverlay) {
      // Fixed-positioned overlays over the iframe — no need to hide chat
      document.body.classList.add('guide-insights-open');
      overlay.style.display = '';
      return;
    }

    // In-panel overlays: hide chat area + input to make room
    if (chatMessages) chatMessages.style.display = 'none';
    if (inputBar) inputBar.style.display = 'none';
    // Expand panel to wide
    _previousPanelState = document.body.dataset.panel;
    if (document.body.dataset.panel !== 'wide') setPanelState('wide');
    overlay.style.display = '';
  }

  function closeGuideOverlay(overlay) {
    overlay.style.display = 'none';

    if (overlay === insightsOverlay) {
      // Fixed overlays are outside the panel — nothing else to restore
      document.body.classList.remove('guide-insights-open');
      return;
    }

    // In-panel overlays: restore chat area + input
    if (chatMessages) chatMessages.style.display = '';
    if (inputBar) inputBar.style.display = '';
    // Restore previous panel state
    if (_previousPanelState && _previousPanelState !== 'wide') {
      setPanelState(_previousPanelState);
    }
    _previousPanelState = null;
  }

  function closeAllOverlays() {
    allOverlays.forEach(o => { if (o) o.style.display = 'none'; });
    document.body.classList.remove('guide-insights-open');
    if (chatMessages) chatMessages.style.display = '';
    if (inputBar) inputBar.style.display = '';
    if (_previousPanelState && _previousPanelState !== 'wide') {
      setPanelState(_previousPanelState);
    }
    _previousPanelState = null;
  }

  // Close modals opened from settings (without closing settings itself)
  function closeSettingsModals() {
    var ids = [
      'manage-users-modal-overlay',
      'team-settings-modal-overlay',
      'customer-settings-modal-overlay',
      'field-group-modal'
    ];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  // Settings overlay
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      if (settingsOverlay.style.display !== 'none') {
        closeGuideOverlay(settingsOverlay);
        return;
      }
      openGuideOverlay(settingsOverlay);
      renderSettingsOverlay();
    });
  }

  var settingsOverlayClose = document.getElementById('settings-overlay-close');
  if (settingsOverlayClose) {
    settingsOverlayClose.addEventListener('click', () => {
      closeGuideOverlay(settingsOverlay);
    });
  }

  // ── Team Settings Modal (migrated from app.js) ───────────
  let _teamSettingsDraft = [];
  let _teamSettingsMode = 'session';

  function renderTeamSettingsModal() {
    const body = document.getElementById('team-settings-body');
    const title = document.getElementById('team-settings-title');
    const subtitle = document.getElementById('team-settings-subtitle');
    if (!body || !title || !subtitle) return;

    const { title: titleText, subtitle: subtitleText } = window.teamSettingsModeMeta(_teamSettingsMode);
    title.textContent = titleText;
    subtitle.textContent = subtitleText;

    const editingDefaults = _teamSettingsMode === 'default';

    const rows = _teamSettingsDraft.map((team, index) => {
      const memberCount = Array.isArray(team.members) ? team.members.length : 0;
      const memberText = memberCount === 0
        ? 'No members assigned'
        : `${memberCount} member${memberCount === 1 ? '' : 's'} linked`;

      return `<div class="team-settings-editor-row ${editingDefaults ? 'editing-defaults' : ''}" data-index="${index}">
        <div class="team-settings-editor-main">
          <label class="team-settings-field-label" for="team-settings-name-${index}">Team name</label>
          <input
            class="team-settings-name-input"
            id="team-settings-name-${index}"
            type="text"
            value="${window.escapeHtml(team.name)}"
            placeholder="Team name"
          />
          <div class="team-settings-row-meta">${memberText}</div>
        </div>
        <div class="team-settings-editor-focus">
          <div class="team-settings-field-label">Focus</div>
          <div class="ai-setup-team-row-choices">
            ${['resolve', 'convert', 'both'].map(usecase => `
              <button
                class="ai-setup-team-choice ${window.normalizeTeamUsecase(team.usecase) === usecase ? 'selected' : ''}"
                data-index="${index}"
                data-usecase="${usecase}"
                type="button"
              >${usecase === 'resolve' ? 'Support' : usecase === 'convert' ? 'Sales' : 'Both'}</button>
            `).join('')}
          </div>
        </div>
        ${editingDefaults ? `
        <div class="team-settings-editor-scope">
          <div class="team-settings-field-label">Supervisor onboarding</div>
          <div class="team-settings-scope-toggle">
            <button
              class="team-settings-scope-btn ${window.normalizeSupervisorScope(team.supervisorScope) ? 'selected' : ''}"
              data-index="${index}"
              data-supervisor-scope="true"
              type="button"
            >Included</button>
            <button
              class="team-settings-scope-btn ${!window.normalizeSupervisorScope(team.supervisorScope) ? 'selected' : ''}"
              data-index="${index}"
              data-supervisor-scope="false"
              type="button"
            >Excluded</button>
          </div>
        </div>` : ''}
        <button class="team-settings-delete-btn" data-index="${index}" type="button">Delete</button>
      </div>`;
    }).join('');

    body.innerHTML = `
      <div class="team-settings-toolbar">
        <div class="team-settings-toolbar-note">${editingDefaults ? 'Default changes affect new or reset team setups on this browser.' : 'Session changes update the team filter and current dashboard view.'}</div>
      </div>
      <div class="team-settings-editor-list">${rows}</div>
      <div class="team-settings-footer-tools">
        <button class="team-settings-add-btn" id="team-settings-add-btn" type="button">Add team</button>
      </div>
      <div class="team-settings-error" id="team-settings-error"></div>
    `;

    body.querySelectorAll('.team-settings-name-input').forEach(input => {
      input.addEventListener('input', () => {
        const index = Number(input.closest('.team-settings-editor-row')?.dataset.index);
        if (Number.isNaN(index) || !_teamSettingsDraft[index]) return;
        _teamSettingsDraft[index].name = input.value;
      });
    });

    body.querySelectorAll('.ai-setup-team-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.index);
        if (Number.isNaN(index) || !_teamSettingsDraft[index]) return;
        _teamSettingsDraft[index].usecase = btn.dataset.usecase;
        renderTeamSettingsModal();
      });
    });

    body.querySelectorAll('[data-supervisor-scope]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.index);
        if (Number.isNaN(index) || !_teamSettingsDraft[index]) return;
        _teamSettingsDraft[index].supervisorScope = btn.dataset.supervisorScope === 'true';
        renderTeamSettingsModal();
      });
    });

    body.querySelectorAll('.team-settings-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.index);
        if (Number.isNaN(index)) return;
        _teamSettingsDraft.splice(index, 1);
        renderTeamSettingsModal();
      });
    });

    body.querySelector('#team-settings-add-btn')?.addEventListener('click', () => {
      _teamSettingsDraft.push({
        name: '',
        members: [],
        usecase: 'resolve',
        supervisorScope: true,
        originalName: null,
      });
      renderTeamSettingsModal();
      requestAnimationFrame(() => {
        const lastInput = body.querySelector('.team-settings-editor-row:last-child .team-settings-name-input');
        lastInput?.focus();
      });
    });
  }

  function saveTeamSettingsModal() {
    const body = document.getElementById('team-settings-body');
    const errorEl = document.getElementById('team-settings-error');
    const { teams, renameMap, error } = window.validateTeamSettingsDraft(_teamSettingsDraft);

    if (error) {
      if (errorEl) errorEl.textContent = error;
      return false;
    }

    if (_teamSettingsMode === 'default') {
      window.applyTeamSettingsDefault(teams);
    } else {
      window.applySavedTeams(teams, renameMap);
    }

    if (body) body.scrollTop = 0;
    closeTeamSettingsModal();
    return true;
  }

  function openTeamSettingsModal(mode = 'session') {
    _teamSettingsMode = mode;
    _teamSettingsDraft = window.buildTeamSettingsDraft(window.getTeamSettingsSource(mode));
    renderTeamSettingsModal();
    document.getElementById('team-settings-modal-overlay').style.display = 'flex';
  }

  function closeTeamSettingsModal() {
    document.getElementById('team-settings-modal-overlay').style.display = 'none';
  }

  // Wire team settings modal buttons
  document.getElementById('team-settings-modal-close')?.addEventListener('click', closeTeamSettingsModal);
  document.getElementById('team-settings-cancel')?.addEventListener('click', closeTeamSettingsModal);
  document.getElementById('team-settings-save')?.addEventListener('click', saveTeamSettingsModal);
  document.getElementById('team-settings-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('team-settings-modal-overlay')) closeTeamSettingsModal();
  });

  window.openTeamSettingsModal = openTeamSettingsModal;

  // ── Customer Settings Modal (migrated from app.js) ───────
  var _defaultCustomerProfiles = [];
  var _userCustomerProfiles = [];
  var _addCustomerDraft = null;
  var _editingUserCustomerIndex = null;
  var _editingUserCustomerDraft = null;
  var _addSectionCollapsed = false;
  var _builtInCustomerIds = new Set();

  function buildKnownTeamsFromText(value) {
    return window.uniqueNonEmptyLines(value).map(function(name) {
      var likelyFocus = window.guessCustomerTeamFocus(name);
      return likelyFocus ? { name: name, likelyFocus: likelyFocus } : { name: name };
    });
  }

  function _draftFromProfile(profile, index) {
    var normalized = window.normalizeCustomerProfile(profile, index);
    return Object.assign({}, window.cloneJson(normalized), {
      knownTeamsText: (normalized.knownTeams || []).map(function(t) { return t.name; }).join('\n'),
      extraSourceUrlsText: Array.isArray(normalized.extraSourceUrls) ? normalized.extraSourceUrls.join('\n') : '',
    });
  }

  function _profileFromDraft(draft, index) {
    return window.normalizeCustomerProfile(Object.assign({}, draft, {
      company: String(draft.company || '').trim(),
      industry: String(draft.industry || '').trim(),
      website: String(draft.website || '').trim(),
      helpCenterUrl: String(draft.helpCenterUrl || '').trim(),
      productSummary: String(draft.productSummary || '').trim(),
      generalNotes: String(draft.generalNotes || '').trim(),
      extraSourceUrls: window.uniqueNonEmptyLines(draft.extraSourceUrlsText),
      knownTeams: buildKnownTeamsFromText(draft.knownTeamsText),
    }), index);
  }

  function _allProfilesList() {
    return _defaultCustomerProfiles.concat(_userCustomerProfiles);
  }

  function _persistAndRefreshCustomers() {
    window.CustomerProfilesStore.saveAll(_allProfilesList());
    refreshMetaStartScreen();
  }

  function _validateCustomerDraft(draft, existingProfiles, excludeId) {
    var company = String(draft.company || '').trim();
    if (!company) return { error: 'Company name is required.' };
    var dup = existingProfiles.find(function(p) {
      return p.id !== excludeId && p.company.toLowerCase() === company.toLowerCase();
    });
    if (dup) return { error: '"' + company + '" already exists.' };
    return { ok: true };
  }

  function _renderCustomerFormFields(draft, prefix) {
    return '\
      <div class="customer-settings-grid">\
        <div class="customer-settings-field">\
          <label class="team-settings-field-label">Company name</label>\
          <input class="customer-settings-input" data-' + prefix + '-field="company" type="text" value="' + window.escapeHtml(draft.company || '') + '" placeholder="Company name" />\
        </div>\
        <div class="customer-settings-field">\
          <label class="team-settings-field-label">Industry</label>\
          <input class="customer-settings-input" data-' + prefix + '-field="industry" type="text" value="' + window.escapeHtml(draft.industry || '') + '" placeholder="Industry" />\
        </div>\
        <div class="customer-settings-field">\
          <label class="team-settings-field-label">Website</label>\
          <input class="customer-settings-input" data-' + prefix + '-field="website" type="url" value="' + window.escapeHtml(draft.website || '') + '" placeholder="https://example.com" />\
        </div>\
        <div class="customer-settings-field">\
          <label class="team-settings-field-label">Help center / docs URL</label>\
          <input class="customer-settings-input" data-' + prefix + '-field="helpCenterUrl" type="url" value="' + window.escapeHtml(draft.helpCenterUrl || '') + '" placeholder="https://help.example.com" />\
        </div>\
        <div class="customer-settings-field-wide">\
          <label class="team-settings-field-label">Product or service summary</label>\
          <textarea class="customer-settings-textarea" data-' + prefix + '-field="productSummary" placeholder="What does this company do?">' + window.escapeHtml(draft.productSummary || '') + '</textarea>\
        </div>\
        <div class="customer-settings-field">\
          <label class="team-settings-field-label">Known teams</label>\
          <textarea class="customer-settings-textarea" data-' + prefix + '-field="knownTeamsText" placeholder="One team per line">' + window.escapeHtml(draft.knownTeamsText || '') + '</textarea>\
        </div>\
        <div class="customer-settings-field">\
          <label class="team-settings-field-label">Extra source URLs</label>\
          <textarea class="customer-settings-textarea" data-' + prefix + '-field="extraSourceUrlsText" placeholder="One URL per line">' + window.escapeHtml(draft.extraSourceUrlsText || '') + '</textarea>\
        </div>\
        <div class="customer-settings-field-wide">\
          <label class="team-settings-field-label">General information</label>\
          <textarea class="customer-settings-textarea" data-' + prefix + '-field="generalNotes" placeholder="Anything else the onboarding agent should know about this customer...">' + window.escapeHtml(draft.generalNotes || '') + '</textarea>\
        </div>\
      </div>';
  }

  function renderCustomerSettingsModal() {
    var body = document.getElementById('customer-settings-body');
    if (!body) return;

    var modalEl = document.getElementById('customer-settings-modal');
    if (modalEl) {
      var h3 = modalEl.querySelector('.modal-header h3');
      var sub = modalEl.querySelector('.modal-subtitle');
      if (h3) h3.textContent = 'Manage Customers';
      if (sub) sub.textContent = 'Add your own customer profiles or use the built-in defaults.';
    }

    var isAddCollapsed = _addSectionCollapsed || _editingUserCustomerIndex !== null;

    var defaultRows = _defaultCustomerProfiles.map(function(p) {
      return '<div class="cs-default-row">' +
        '<span class="cs-default-company">' + window.escapeHtml(p.company) + '</span>' +
        '<span class="cs-default-sep">&middot;</span>' +
        '<span class="cs-default-description">' + window.escapeHtml(p.description || p.industry || '') + '</span>' +
      '</div>';
    }).join('');

    var section1 = '\
      <div class="cs-section">\
        <div class="cs-section-header">\
          <div class="cs-section-title">Default Customers</div>\
          <div class="cs-section-note">System-level demo profiles \u2014 these can\'t be edited or removed.</div>\
        </div>\
        <div class="cs-defaults-list">' + defaultRows + '</div>\
      </div>';

    var section2 = '\
      <div class="cs-section cs-section-add' + (isAddCollapsed ? ' collapsed' : '') + '">\
        <button class="cs-add-collapsed-header" id="cs-expand-add-btn" type="button">\
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\
          Add New Customer\
        </button>\
        <div class="cs-section-header">\
          <div class="cs-section-title">Add New Customer</div>\
        </div>\
        <div class="cs-add-form">\
          ' + _renderCustomerFormFields(_addCustomerDraft || {}, 'add') + '\
          <div class="cs-add-form-actions">\
            <button class="cs-add-save-btn" id="cs-add-save-btn" type="button">Save</button>\
            <button class="customer-settings-add-btn customer-settings-upload-btn" id="customer-settings-upload-btn" type="button">Upload file</button>\
            <input type="file" id="customer-settings-file-input" accept=".pdf,.docx,.txt,.csv" style="display:none">\
          </div>\
          <div class="customer-settings-upload-status" id="customer-settings-upload-status" style="display:none"></div>\
          <div class="cs-error" id="cs-add-error"></div>\
        </div>\
      </div>';

    var userRows = '';
    if (_userCustomerProfiles.length === 0) {
      userRows = '<div class="cs-user-empty">No custom customers yet.</div>';
    } else {
      userRows = _userCustomerProfiles.map(function(p, i) {
        var isEditing = _editingUserCustomerIndex === i;
        var html = '\
          <div class="cs-user-row' + (isEditing ? ' editing' : '') + '" data-user-index="' + i + '">\
            <div class="cs-user-info">\
              <span class="cs-user-company">' + window.escapeHtml(p.company) + '</span>\
              <span class="cs-user-industry">' + window.escapeHtml(p.industry || '') + '</span>\
            </div>\
            <div class="cs-user-actions">\
              <button class="cs-user-edit-btn" data-user-edit="' + i + '" type="button" title="Edit">\
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>\
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>\
                </svg>\
              </button>\
              <button class="cs-user-delete-btn" data-user-delete="' + i + '" type="button" title="Delete">\
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>\
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>\
                </svg>\
              </button>\
            </div>\
          </div>';
        if (isEditing && _editingUserCustomerDraft) {
          html += '\
            <div class="cs-user-edit-drawer">\
              ' + _renderCustomerFormFields(_editingUserCustomerDraft, 'edit') + '\
              <div class="cs-edit-drawer-actions">\
                <button class="cs-edit-cancel-btn" id="cs-edit-cancel-btn" type="button">Cancel</button>\
                <button class="cs-edit-save-btn" id="cs-edit-save-btn" type="button">Save</button>\
              </div>\
              <div class="cs-error" id="cs-edit-error"></div>\
            </div>';
        }
        return html;
      }).join('');
    }

    var section3 = '\
      <div class="cs-section">\
        <div class="cs-section-header">\
          <div class="cs-section-title">Your Customers</div>\
        </div>\
        <div class="cs-user-list">' + userRows + '</div>\
      </div>';

    body.innerHTML = section1 + section2 + section3;

    // Wire events
    body.querySelectorAll('[data-add-field]').forEach(function(input) {
      input.addEventListener('input', function() {
        if (_addCustomerDraft) _addCustomerDraft[input.dataset.addField] = input.value;
      });
    });

    var addSaveBtn = body.querySelector('#cs-add-save-btn');
    if (addSaveBtn) addSaveBtn.addEventListener('click', function() {
      var errorEl = body.querySelector('#cs-add-error');
      var v = _validateCustomerDraft(_addCustomerDraft, _allProfilesList(), null);
      if (v.error) { if (errorEl) errorEl.textContent = v.error; return; }
      var profile = _profileFromDraft(_addCustomerDraft, _userCustomerProfiles.length);
      _userCustomerProfiles.push(profile);
      _persistAndRefreshCustomers();
      _addCustomerDraft = Object.assign({}, window.CustomerProfilesStore.createBlank(), { knownTeamsText: '', extraSourceUrlsText: '' });
      renderCustomerSettingsModal();
      requestAnimationFrame(function() {
        var rows = body.querySelectorAll('.cs-user-row');
        if (rows.length) rows[rows.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    var uploadBtn = body.querySelector('#customer-settings-upload-btn');
    if (uploadBtn) uploadBtn.addEventListener('click', function() {
      var fileInput = body.querySelector('#customer-settings-file-input');
      if (fileInput) fileInput.click();
    });
    var fileInput = body.querySelector('#customer-settings-file-input');
    if (fileInput) fileInput.addEventListener('change', function(e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var statusEl = body.querySelector('#customer-settings-upload-status');
      var ulBtn = body.querySelector('#customer-settings-upload-btn');
      if (statusEl) { statusEl.style.display = ''; statusEl.textContent = 'Analyzing ' + file.name + '\u2026'; }
      if (ulBtn) ulBtn.disabled = true;
      AdminAssistant.analyzeFileForCustomer(file).then(function(profile) {
        _addCustomerDraft = Object.assign({}, window.CustomerProfilesStore.createBlank(), {
          company: profile.company || '',
          industry: profile.industry || '',
          website: profile.website || '',
          helpCenterUrl: profile.helpCenterUrl || '',
          productSummary: profile.productSummary || '',
          generalNotes: profile.generalNotes || '',
          knownTeamsText: (profile.knownTeams || []).join('\n'),
          extraSourceUrlsText: '',
        });
        _editingUserCustomerIndex = null;
        _editingUserCustomerDraft = null;
        renderCustomerSettingsModal();
      }).catch(function(err) {
        if (statusEl) statusEl.textContent = 'Failed to analyze file: ' + err.message;
      }).finally(function() {
        if (ulBtn) ulBtn.disabled = false;
      });
    });

    var expandAddBtn = body.querySelector('#cs-expand-add-btn');
    if (expandAddBtn) expandAddBtn.addEventListener('click', function() {
      _editingUserCustomerIndex = null;
      _editingUserCustomerDraft = null;
      _addSectionCollapsed = false;
      renderCustomerSettingsModal();
    });

    body.querySelectorAll('[data-user-edit]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = Number(btn.dataset.userEdit);
        if (Number.isNaN(idx) || !_userCustomerProfiles[idx]) return;
        _editingUserCustomerIndex = idx;
        _editingUserCustomerDraft = _draftFromProfile(_userCustomerProfiles[idx], idx);
        renderCustomerSettingsModal();
      });
    });

    body.querySelectorAll('[data-user-delete]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = Number(btn.dataset.userDelete);
        if (Number.isNaN(idx) || !_userCustomerProfiles[idx]) return;
        if (!confirm('Delete "' + _userCustomerProfiles[idx].company + '"?')) return;
        _userCustomerProfiles.splice(idx, 1);
        if (_editingUserCustomerIndex === idx) {
          _editingUserCustomerIndex = null;
          _editingUserCustomerDraft = null;
        } else if (_editingUserCustomerIndex !== null && _editingUserCustomerIndex > idx) {
          _editingUserCustomerIndex--;
        }
        _persistAndRefreshCustomers();
        renderCustomerSettingsModal();
      });
    });

    body.querySelectorAll('[data-edit-field]').forEach(function(input) {
      input.addEventListener('input', function() {
        if (_editingUserCustomerDraft) _editingUserCustomerDraft[input.dataset.editField] = input.value;
      });
    });

    var editSaveBtn = body.querySelector('#cs-edit-save-btn');
    if (editSaveBtn) editSaveBtn.addEventListener('click', function() {
      var errorEl = body.querySelector('#cs-edit-error');
      var originalId = _userCustomerProfiles[_editingUserCustomerIndex] && _userCustomerProfiles[_editingUserCustomerIndex].id;
      var v = _validateCustomerDraft(_editingUserCustomerDraft, _allProfilesList(), originalId);
      if (v.error) { if (errorEl) errorEl.textContent = v.error; return; }
      _userCustomerProfiles[_editingUserCustomerIndex] = _profileFromDraft(_editingUserCustomerDraft, _editingUserCustomerIndex);
      _editingUserCustomerIndex = null;
      _editingUserCustomerDraft = null;
      _addSectionCollapsed = true;
      _persistAndRefreshCustomers();
      renderCustomerSettingsModal();
    });

    var editCancelBtn = body.querySelector('#cs-edit-cancel-btn');
    if (editCancelBtn) editCancelBtn.addEventListener('click', function() {
      _editingUserCustomerIndex = null;
      _editingUserCustomerDraft = null;
      _addSectionCollapsed = true;
      renderCustomerSettingsModal();
    });
  }

  function openCustomerSettingsModal() {
    window.CustomerProfilesStore.loadAll().then(function(profiles) {
      if (_builtInCustomerIds.size === 0 && window.BUILT_IN_CUSTOMER_PROFILES) {
        window.BUILT_IN_CUSTOMER_PROFILES.forEach(function(p) { _builtInCustomerIds.add(p.id); });
      }
      _defaultCustomerProfiles = profiles.filter(function(p) { return _builtInCustomerIds.has(p.id); });
      _userCustomerProfiles = profiles.filter(function(p) { return !_builtInCustomerIds.has(p.id); });
      _addCustomerDraft = Object.assign({}, window.CustomerProfilesStore.createBlank(), { knownTeamsText: '', extraSourceUrlsText: '' });
      _editingUserCustomerIndex = null;
      _editingUserCustomerDraft = null;
      _addSectionCollapsed = false;
      renderCustomerSettingsModal();
      var overlay = document.getElementById('customer-settings-modal-overlay');
      if (overlay) overlay.style.display = 'flex';
    });
  }

  function closeCustomerSettingsModal() {
    var overlay = document.getElementById('customer-settings-modal-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // Wire customer settings modal buttons
  document.getElementById('customer-settings-modal-close')?.addEventListener('click', closeCustomerSettingsModal);
  document.getElementById('customer-settings-cancel')?.addEventListener('click', closeCustomerSettingsModal);
  document.getElementById('customer-settings-modal-overlay')?.addEventListener('click', function(e) {
    if (e.target === document.getElementById('customer-settings-modal-overlay')) closeCustomerSettingsModal();
  });

  window.openCustomerSettingsModal = openCustomerSettingsModal;

  // ── Meta-Start: Customer + Role Selection (migrated from admin-assistant.js) ──
  const META_START_AUTO_SCROLL_DELAY_MS = 200;
  const META_START_AUTO_SCROLL_TOP_MARGIN = 24;
  let _selectedCustomerId = null;
  let _selectedRole = null;
  let _metaStartAutoScrollTimeout = null;

  function clearMetaStartAutoScroll() {
    if (_metaStartAutoScrollTimeout) {
      clearTimeout(_metaStartAutoScrollTimeout);
      _metaStartAutoScrollTimeout = null;
    }
  }

  function isElementClippedAtContainerBottom(element, container) {
    if (!element || !container) return false;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return elementRect.bottom > containerRect.bottom;
  }

  function getElementBottomAfterScroll(element, container, scrollTop) {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const elementTopInContainer = container.scrollTop + (elementRect.top - containerRect.top);
    const elementBottomInContainer = elementTopInContainer + elementRect.height;
    return elementBottomInContainer - scrollTop;
  }

  function maybeAutoScrollMetaStartBottom(target) {
    clearMetaStartAutoScroll();
    if (!target?.isConnected) return;

    const container = document.getElementById('ai-setup-meta');
    if (!container || !container.isConnected || !isElementClippedAtContainerBottom(target, container)) return;

    const bottomScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    if (bottomScrollTop <= container.scrollTop + 1) return;
    if (getElementBottomAfterScroll(target, container, bottomScrollTop) <= META_START_AUTO_SCROLL_TOP_MARGIN) return;

    _metaStartAutoScrollTimeout = window.setTimeout(() => {
      _metaStartAutoScrollTimeout = null;
      if (!target.isConnected || !container.isConnected) return;
      if (!isElementClippedAtContainerBottom(target, container)) return;

      const latestBottomScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      if (getElementBottomAfterScroll(target, container, latestBottomScrollTop) <= META_START_AUTO_SCROLL_TOP_MARGIN) return;

      const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth';
      container.scrollTo({
        top: latestBottomScrollTop,
        behavior,
      });
    }, META_START_AUTO_SCROLL_DELAY_MS);
  }

  function selectCustomerCard(customerId) {
    _selectedCustomerId = customerId;
    document.querySelectorAll('.ai-setup-customer-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.customerId === customerId);
    });
    updateContinueButton();
    const roleGrid = document.querySelector('.ai-setup-role-grid');
    if (roleGrid) maybeAutoScrollMetaStartBottom(roleGrid);
  }

  function selectRoleCard(role) {
    _selectedRole = role;
    document.querySelectorAll('.ai-setup-role-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.role === role);
    });
    updateContinueButton();
    const footer = document.querySelector('.ai-setup-meta-footer');
    if (footer) maybeAutoScrollMetaStartBottom(footer);
  }

  function updateContinueButton() {
    const btn = document.getElementById('ai-setup-continue-btn');
    if (!btn) return;
    btn.disabled = !(_selectedCustomerId && _selectedRole);
  }

  function autoSelectPrevious(customers) {
    if (typeof AssistantStorage === 'undefined') return;
    const active = AssistantStorage.getActiveSession();
    if (!active.customerId && !active.role) return;

    if (active.customerId && customers.some(c => c.id === active.customerId)) {
      selectCustomerCard(active.customerId);
    }
    if (active.role && ['admin', 'supervisor', 'agent'].includes(active.role)) {
      selectRoleCard(active.role);
    }
  }

  async function initMetaStartScreen() {
    const grid = document.getElementById('ai-setup-customer-grid');
    if (!grid) return;

    let customers = [];
    if (window.CustomerProfilesStore?.loadAll) {
      try {
        customers = await window.CustomerProfilesStore.loadAll();
      } catch (e) {
        console.warn('[ProtoGuide] Could not load customer profiles:', e);
      }
    }

    grid.innerHTML = '';

    customers.forEach(c => {
      const card = document.createElement('div');
      card.className = 'ai-setup-customer-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.dataset.customerId = c.id;
      card.innerHTML = `
        <span class="ai-setup-customer-name">${window.escapeHtml(c.company)}</span>
        <span class="ai-setup-customer-industry">${window.escapeHtml(c.industry)}</span>
        ${c.description ? `<span class="ai-setup-customer-description">${window.escapeHtml(c.description)}</span>` : ''}
        <button class="ai-setup-customer-edit" type="button" title="Edit customer" aria-label="Edit ${window.escapeHtml(c.company)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.ai-setup-customer-edit')) return;
        selectCustomerCard(c.id);
        if (window.sendEvent) window.sendEvent('Onboarding — selected company: ' + c.company);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectCustomerCard(c.id);
        }
      });
      card.querySelector('.ai-setup-customer-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        clearMetaStartAutoScroll();
        openCustomerSettingsModal();
      });
      grid.appendChild(card);
    });

    const addBtn = document.getElementById('ai-setup-add-customer-btn');
    if (addBtn) {
      addBtn.onclick = () => {
        clearMetaStartAutoScroll();
        openCustomerSettingsModal();
      };
    }

    autoSelectPrevious(customers);
  }

  function initRoleSelection() {
    document.querySelectorAll('.ai-setup-role-card').forEach(card => {
      card.onclick = () => {
        selectRoleCard(card.dataset.role);
        if (window.sendEvent) window.sendEvent('Onboarding — selected role: ' + card.dataset.role);
      };
    });
  }

  function wireMetaStartContinue() {
    const btn = document.getElementById('ai-setup-continue-btn');
    if (!btn || btn.dataset.wired === 'true') return;
    btn.dataset.wired = 'true';
    btn.addEventListener('click', async () => {
      if (!_selectedCustomerId || !_selectedRole) return;
      if (typeof AdminAssistant !== 'undefined' && AdminAssistant.startWithSelection) {
        await AdminAssistant.startWithSelection(_selectedCustomerId, _selectedRole);
      }
    });
  }

  async function refreshMetaStartScreen() {
    const previousCustomerId = _selectedCustomerId;
    const previousRole = _selectedRole;
    await initMetaStartScreen();
    if (previousCustomerId) {
      const cards = document.querySelectorAll('.ai-setup-customer-card');
      const stillExists = Array.from(cards).some(c => c.dataset.customerId === previousCustomerId);
      if (stillExists) {
        selectCustomerCard(previousCustomerId);
      } else {
        _selectedCustomerId = null;
      }
    }
    if (previousRole) {
      selectRoleCard(previousRole);
    }
    updateContinueButton();
  }

  // Expose meta-start functions on window for admin-assistant.js to call
  window.initMetaStartScreen = initMetaStartScreen;
  window.initRoleSelection = initRoleSelection;
  window.wireMetaStartContinue = wireMetaStartContinue;
  window.refreshMetaStartScreen = refreshMetaStartScreen;
  window.clearMetaStartAutoScroll = clearMetaStartAutoScroll;

  // ── Settings Overlay Rendering ─────────────────────────────

  function renderSettingsOverlay() {
    const api = window._prototypeGuideAPI;
    if (!api) return;
    const body = document.getElementById('settings-overlay-body');
    if (!body) return;

    const settingsData = api.getSettingsData();
    const adminData = api.getAdminData();
    let html = '';

    // Role selector
    html += '<div class="guide-setting-block">';
    html += '<div class="guide-setting-header">Dashboard Role</div>';
    html += '<div class="guide-role-toggle">';
    (settingsData.role.options || []).forEach(function(opt) {
      var active = opt.value === settingsData.role.current ? ' active' : '';
      html += '<button class="guide-role-btn' + active + '" data-role="' + opt.value + '">' + opt.label + '</button>';
    });
    html += '</div></div>';

    // Anchors nav toggle
    html += '<div class="guide-setting-block"><div class="guide-toggle-wrapper">';
    html += '<div class="guide-setting-header">Anchors navigation</div>';
    html += '<div class="guide-toggle-track' + (settingsData.anchorsNavUser ? ' active' : '') + '" id="settings-anchors-toggle" data-toggle-key="anchorsNavUser"></div>';
    html += '</div></div>';

    // Configure Thresholds button (opens modal)
    if (adminData) {
      html += '<div class="guide-popout-divider"></div>';
      html += '<div class="guide-setting-block">';
      html += '<div class="guide-setting-header">Decision Thresholds</div>';
      html += '<div class="guide-setting-subtext">Confidence thresholds that control onboarding agent decisions</div>';
      html += '<button class="guide-action-btn" id="settings-configure-thresholds">Configure Thresholds</button>';
      html += '</div>';
    }

    // Actions
    html += '<div class="guide-popout-divider"></div>';
    // Manage Users (admin only) — above Manage Teams
    if (currentUser && hasMinRole(currentUser.role, 'admin')) {
      html += '<div class="guide-setting-block"><button class="guide-action-btn" id="settings-manage-users">Manage Users</button></div>';
    }
    html += '<div class="guide-setting-block"><button class="guide-action-btn" id="settings-manage-teams">Manage Teams</button></div>';
    html += '<div class="guide-setting-block"><button class="guide-action-btn" id="settings-manage-customers">Manage Customers</button></div>';
    html += '<div class="guide-popout-divider"></div>';
    html += '<div class="guide-setting-block"><button class="guide-action-btn" id="settings-reset-onboarding">Reset Onboarding</button></div>';
    html += '<div class="guide-setting-block"><button class="guide-action-btn guide-action-btn--danger" id="settings-reset-all">Reset Everything</button></div>';

    // Sign out
    html += '<div class="guide-popout-divider"></div>';
    html += '<div class="guide-setting-block guide-signout-block">';
    html += '<div class="guide-signout-email">' + (currentUser ? currentUser.email : '') + '</div>';
    html += '<button class="guide-action-btn guide-signout-btn" id="settings-sign-out">Sign Out</button>';
    html += '</div>';

    body.innerHTML = html;

    // Wire role toggle buttons
    body.querySelectorAll('.guide-role-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        body.querySelectorAll('.guide-role-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        postToPrototype({ type: 'guide:set-role', role: btn.dataset.role });
      });
    });

    // Wire anchors toggle track
    var anchorsToggle = document.getElementById('settings-anchors-toggle');
    if (anchorsToggle) anchorsToggle.addEventListener('click', function() {
      anchorsToggle.classList.toggle('active');
      postToPrototype({ type: 'guide:set-toggle', key: 'anchorsNavUser', checked: anchorsToggle.classList.contains('active') });
    });

    // Wire configure thresholds button
    var thresholdsBtn = document.getElementById('settings-configure-thresholds');
    if (thresholdsBtn) thresholdsBtn.addEventListener('click', function() {
      closeSettingsModals();
      openThresholdsModal();
    });

    var manageTeamsBtn = document.getElementById('settings-manage-teams');
    if (manageTeamsBtn) manageTeamsBtn.addEventListener('click', function() {
      closeSettingsModals();
      openTeamSettingsModal();
    });

    var resetOnboardingBtn = document.getElementById('settings-reset-onboarding');
    if (resetOnboardingBtn) resetOnboardingBtn.addEventListener('click', function() {
      if (window.performResetOnboarding) window.performResetOnboarding();
    });

    var resetAllBtn = document.getElementById('settings-reset-all');
    if (resetAllBtn) resetAllBtn.addEventListener('click', function() {
      if (confirm('Reset all prototype state? This cannot be undone.')) {
        if (window.performResetAll) window.performResetAll();
      }
    });

    var manageUsersBtn = document.getElementById('settings-manage-users');
    if (manageUsersBtn) manageUsersBtn.addEventListener('click', function() {
      closeSettingsModals();
      openManageUsersModal();
    });

    var manageCustomersBtn = document.getElementById('settings-manage-customers');
    if (manageCustomersBtn) manageCustomersBtn.addEventListener('click', function() {
      closeSettingsModals();
      openCustomerSettingsModal();
    });

    var signOutBtn = document.getElementById('settings-sign-out');
    if (signOutBtn) signOutBtn.addEventListener('click', function() {
      localStorage.removeItem('protoguide_user');
      localStorage.removeItem('protoguide_token');
      window.location.href = 'protoguide-login.html';
    });
  }

  // ── Decision Thresholds Modal ─────────────────────────────

  var fieldGroupModal = document.getElementById('field-group-modal');
  var fieldGroupModalClose = document.getElementById('field-group-modal-close');

  if (fieldGroupModalClose) {
    fieldGroupModalClose.addEventListener('click', function() {
      if (fieldGroupModal) fieldGroupModal.style.display = 'none';
    });
  }
  if (fieldGroupModal) {
    fieldGroupModal.addEventListener('click', function(e) {
      if (e.target === fieldGroupModal) fieldGroupModal.style.display = 'none';
    });
  }

  function openThresholdsModal() {
    if (!fieldGroupModal) return;
    var api = window._prototypeGuideAPI;
    if (!api) return;
    var adminData = api.getAdminData();
    if (!adminData) return;

    var title = document.getElementById('field-group-modal-title');
    var body = document.getElementById('field-group-modal-body');
    if (title) {
      title.innerHTML = 'Decision Thresholds';
      title.innerHTML += '<div class="field-group-modal-subtext">Confidence thresholds that control onboarding agent decisions</div>';
    }
    if (!body) return;

    var sliders = [
      { key: 'confidenceSkipSourceGathering', label: 'Source gathering', description: 'Skip gathering sources when confidence is high enough', minLabel: 'None', maxLabel: 'Max' },
      { key: 'confidenceSkipTeamConfirmation', label: 'Team confirmation', description: 'Skip confirming team assignment when confident', minLabel: 'None', maxLabel: 'Max' },
      { key: 'confidenceSkipDecisionGoals', label: 'Decision goals', description: 'Skip decision goal prompts when confident', minLabel: 'None', maxLabel: 'Max' },
      { key: 'confidenceSkipSignalFollowup', label: 'Signal follow-up', description: 'Skip signal follow-up when confident', minLabel: 'None', maxLabel: 'Max' },
      { key: 'confidenceAutoDraft', label: 'Auto-draft', description: 'Auto-draft configuration when confident', minLabel: 'None', maxLabel: 'Max' },
      { key: 'confidenceSkipDensity', label: 'Density question', description: 'Skip density question when confident', minLabel: 'None', maxLabel: 'Max' },
      { key: 'correctionSensitivity', label: 'Correction sensitivity', description: 'How aggressively the agent corrects itself', minLabel: 'Off', maxLabel: 'All' }
    ];

    var html = '';
    sliders.forEach(function(child) {
      var val = adminData[child.key] !== undefined ? adminData[child.key] : 5;
      html += '<div class="guide-compact-slider-row">';
      html += '<div class="guide-compact-slider-label">';
      html += '<span>' + child.label + '</span>';
      if (child.description) html += '<span class="guide-info-icon" data-tooltip="' + child.description + '">ⓘ</span>';
      html += '</div>';
      html += '<div class="guide-compact-slider-control">';
      html += '<span class="guide-slider-endpoint">' + child.minLabel + '</span>';
      html += '<input type="range" class="guide-slider" data-slider-key="' + child.key + '" min="0" max="10" step="1" value="' + val + '">';
      html += '<span class="guide-slider-endpoint">' + child.maxLabel + '</span>';
      html += '<span class="guide-slider-value" data-slider-display="' + child.key + '">' + val + '</span>';
      html += '</div>';
      html += '</div>';
    });

    body.innerHTML = html;

    // Wire sliders
    body.querySelectorAll('.guide-slider[data-slider-key]').forEach(function(slider) {
      var display = body.querySelector('.guide-slider-value[data-slider-display="' + slider.dataset.sliderKey + '"]');
      slider.addEventListener('input', function() {
        if (display) display.textContent = slider.value;
      });
      slider.addEventListener('change', function() {
        postToPrototype({ type: 'guide:set-slider', key: slider.dataset.sliderKey, value: parseFloat(slider.value) });
      });
    });

    fieldGroupModal.style.display = 'flex';
  }

  // ── Manage Users Modal ────────────────────────────────────

  async function openManageUsersModal() {
    var overlay = document.getElementById('manage-users-modal-overlay');
    var body = document.getElementById('manage-users-body');
    if (!overlay || !body) return;
    overlay.style.display = 'flex';
    body.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Loading...</p>';

    try {
      var [domainsResp, usersResp] = await Promise.all([
        authFetch(CHATBOT_PROXY + '/protoguide/domains', { headers: getAuthHeaders() }),
        authFetch(CHATBOT_PROXY + '/protoguide/users', { headers: getAuthHeaders() })
      ]);
      var domainsData = domainsResp.ok ? await domainsResp.json() : { domains: [] };
      var usersData = usersResp.ok ? await usersResp.json() : { users: [] };

      var html = '';

      // Allowed Domains section
      html += '<div class="manage-section">';
      html += '<h4 style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;">Allowed Domains</h4>';
      html += '<p style="margin:0 0 12px;font-size:12px;color:#6b7280;">Users with email addresses from these domains can sign in.</p>';
      html += '<div id="domains-list">';
      (domainsData.domains || []).forEach(function(d) {
        html += '<div class="manage-row" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;">';
        html += '<span style="font-size:13px;flex:1;">' + escapeHtml(d) + '</span>';
        html += '<span class="mu-role-badge mu-role-viewer">viewer</span>';
        html += '<button class="mu-remove-btn remove-domain-btn" data-domain="' + escapeHtml(d) + '" title="Remove domain">&times;</button>';
        html += '</div>';
      });
      html += '</div>';
      html += '<div style="display:flex;gap:8px;margin-top:8px;">';
      html += '<input type="text" id="new-domain-input" class="mu-input" placeholder="e.g. company.com">';
      html += '<button id="add-domain-btn" class="mu-add-btn">Add</button>';
      html += '</div>';
      html += '</div>';

      // Users section
      html += '<div class="manage-section" style="margin-top:20px;">';
      html += '<h4 class="mu-section-title">Users</h4>';

      // Add user form (matching SideCar style)
      html += '<div class="mu-add-form">';
      html += '<input type="email" id="mu-add-email" class="mu-input" placeholder="user@example.com">';
      html += '<select id="mu-add-role" class="mu-input mu-role-select"><option value="viewer">Viewer</option><option value="admin">Admin</option></select>';
      html += '<button class="mu-add-btn" id="mu-add-btn">Add</button>';
      html += '</div>';

      // User list
      html += '<div class="mu-user-list" id="users-list">';
      var currentEmail = (currentUser && currentUser.email) || '';
      var seedEmail = 'rmilwid@gmail.com';
      (usersData.users || []).forEach(function(u) {
        var isSelf = u.email.toLowerCase() === currentEmail.toLowerCase();
        var isSeed = u.email.toLowerCase() === seedEmail.toLowerCase();
        html += '<div class="mu-user-row">';
        html += '<span class="mu-user-email">' + escapeHtml(u.email) + '</span>';
        if (isSeed) {
          html += '<span class="mu-role-badge mu-role-owner">owner</span>';
          if (isSelf) html += '<span class="mu-you-badge">you</span>';
        } else if (isSelf) {
          html += '<span class="mu-role-badge mu-role-' + escapeHtml(u.role) + '">' + escapeHtml(u.role) + '</span>';
          html += '<span class="mu-you-badge">you</span>';
        } else {
          html += '<select class="mu-inline-role mu-role-' + escapeHtml(u.role) + '" data-role-email="' + escapeHtml(u.email) + '">';
          html += '<option value="viewer"' + (u.role === 'viewer' ? ' selected' : '') + '>Viewer</option>';
          html += '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin</option>';
          html += '</select>';
          html += '<button class="mu-remove-btn" data-remove-email="' + escapeHtml(u.email) + '" title="Remove user">&times;</button>';
        }
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';

      body.innerHTML = html;

      // Wire events
      body.querySelectorAll('.remove-domain-btn').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          await authFetch(CHATBOT_PROXY + '/protoguide/domains/' + encodeURIComponent(btn.dataset.domain), { method: 'DELETE', headers: getAuthHeaders() });
          openManageUsersModal(); // refresh
        });
      });

      var addDomainBtn = document.getElementById('add-domain-btn');
      if (addDomainBtn) {
        addDomainBtn.addEventListener('click', async function() {
          var input = document.getElementById('new-domain-input');
          var domain = input.value.trim();
          if (!domain) return;
          await authFetch(CHATBOT_PROXY + '/protoguide/domains', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ domain }) });
          openManageUsersModal(); // refresh
        });
      }

      // Wire add user button
      var addUserBtn = body.querySelector('#mu-add-btn');
      if (addUserBtn) {
        addUserBtn.addEventListener('click', async function() {
          var email = body.querySelector('#mu-add-email').value.trim();
          var role = body.querySelector('#mu-add-role').value;
          if (!email) return;
          addUserBtn.disabled = true;
          try {
            await authFetch(CHATBOT_PROXY + '/protoguide/users', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ email: email, role: role }) });
            openManageUsersModal(); // refresh
          } catch(e) {
            addUserBtn.disabled = false;
          }
        });
      }

      // Wire role change dropdowns
      body.querySelectorAll('.mu-inline-role[data-role-email]').forEach(function(sel) {
        sel.addEventListener('change', async function() {
          await authFetch(CHATBOT_PROXY + '/protoguide/users', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ email: sel.dataset.roleEmail, role: sel.value }) });
        });
      });

      // Wire remove user buttons
      body.querySelectorAll('.mu-remove-btn[data-remove-email]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          if (!confirm('Remove ' + btn.dataset.removeEmail + '?')) return;
          await authFetch(CHATBOT_PROXY + '/protoguide/users/' + encodeURIComponent(btn.dataset.removeEmail), { method: 'DELETE', headers: getAuthHeaders() });
          openManageUsersModal(); // refresh
        });
      });

    } catch (e) {
      body.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px;">Failed to load user data.</p>';
    }
  }

  // Close manage users modal
  var manageUsersModalClose = document.getElementById('manage-users-modal-close');
  if (manageUsersModalClose) {
    manageUsersModalClose.addEventListener('click', function() {
      var overlay = document.getElementById('manage-users-modal-overlay');
      if (overlay) overlay.style.display = 'none';
    });
  }

  // ── Insights overlay ──────────────────────────────────────

  if (insightsBtn) {
    insightsBtn.addEventListener('click', async () => {
      if (insightsOverlay.style.display !== 'none') {
        closeGuideOverlay(insightsOverlay);
        return;
      }
      openGuideOverlay(insightsOverlay);
      await loadFeedbackInsights();
    });
  }

  var insightsOverlayClose = document.getElementById('insights-overlay-close');
  if (insightsOverlayClose) {
    insightsOverlayClose.addEventListener('click', () => {
      closeGuideOverlay(insightsOverlay);
    });
  }

  // Feedback tab switching (inside insights overlay)
  document.querySelectorAll('.guide-feedback-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.guide-feedback-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.guide-feedback-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector('.guide-feedback-panel[data-tab="' + tab.dataset.tab + '"]');
      if (panel) panel.classList.add('active');
    });
  });

  async function fetchFeedbackSummary() {
    try {
      var resp = await fetch(CHATBOT_PROXY + '/protoguide/feedback/summary', { headers: getAuthHeaders() });
      if (resp.ok) {
        var data = await resp.json();
        return data.summaries || null;
      }
    } catch (e) {
      console.error('Failed to fetch feedback summaries:', e);
    }
    return null;
  }

  // Cache raw submissions keyed by id so summary view can show sources
  var _rawSubmissionsById = {};

  function renderFeedbackSummary(summaryData, rawItems) {
    if (!summaryData || !summaryData.categories || !summaryData.categories.length) {
      return null; // signal to fall back to raw
    }
    // Index raw items by id for evidence lookup
    if (rawItems) {
      rawItems.forEach(function (item) { if (item.id) _rawSubmissionsById[item.id] = item; });
    }
    var html = '';
    summaryData.categories.forEach(function (cat) {
      html += '<div class="feedback-summary-category">';
      html += '<h4 class="feedback-summary-category-name">' + escapeHtml(cat.name) + '</h4>';
      cat.items.forEach(function (item) {
        var itemId = item.id || '';
        html += '<div class="feedback-summary-item" data-summary-id="' + escapeHtml(itemId) + '">';
        html += '<div class="feedback-summary-item-header">';
        html += '<span class="feedback-summary-text">' + escapeHtml(item.summary) + '</span>';
        if (item.reportCount > 1) {
          html += '<span class="feedback-report-count">\u00d7' + item.reportCount + '</span>';
        }
        html += '</div>';
        if (item.evidenceIds && item.evidenceIds.length > 0) {
          html += '<button class="feedback-summary-toggle" data-evidence="' + escapeHtml(JSON.stringify(item.evidenceIds)) + '">' + item.evidenceIds.length + ' report' + (item.evidenceIds.length !== 1 ? 's' : '') + ' \u25b8</button>';
          html += '<div class="feedback-summary-sources" style="display:none;">';
          item.evidenceIds.forEach(function (eid) {
            var raw = _rawSubmissionsById[eid];
            if (!raw) return;
            var rawText = raw.text || raw.rawText || raw.raw_text || '';
            html += '<div class="feedback-item" data-id="' + escapeHtml(eid) + '">';
            html += '<div class="feedback-item-header">';
            html += feedbackBadges(raw);
            html += feedbackActions(eid, raw.type || 'product');
            html += '</div>';
            html += formatFeedbackText(rawText);
            var name = raw.submitterName || raw.submitter_name;
            if (name) html += '<div class="feedback-item-submitter">' + escapeHtml(name) + '</div>';
            html += '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    });
    if (summaryData.updatedAt) {
      html += '<div class="feedback-summary-updated">Last organized: ' + new Date(summaryData.updatedAt).toLocaleString() + '</div>';
    }
    return html;
  }

  async function loadFeedbackInsights() {
    const loading = document.getElementById('insights-loading');
    const empty = document.getElementById('insights-empty');
    const content = document.getElementById('insights-content');

    if (loading) loading.style.display = '';
    if (empty) empty.style.display = 'none';
    if (content) content.style.display = 'none';

    try {
      // Fetch summaries and raw submissions in parallel
      var [summaries, allSubmissions] = await Promise.all([
        fetchFeedbackSummary(),
        fetchFeedback()
      ]);

      if ((!summaries || (!summaries.product && !summaries.bugs && !summaries.corrections)) && !allSubmissions.length) {
        if (loading) loading.style.display = 'none';
        if (empty) empty.style.display = '';
        return;
      }

      var productBody = document.getElementById('insights-product-body');
      var bugsBody = document.getElementById('insights-bugs-body');
      var correctionsBody = document.getElementById('insights-corrections-body');

      // Group raw submissions for fallback and evidence lookups
      var grouped = { product: [], bugs: [], corrections: [] };
      allSubmissions.forEach(function (s) {
        if (s.deleted) return;
        if (s.type === 'bug') grouped.bugs.push(s);
        else if (s.type === 'correction') grouped.corrections.push(s);
        else grouped.product.push(s);
      });

      // Try organized summaries first, fall back to raw
      var productHtml = summaries && summaries.product ? renderFeedbackSummary(summaries.product, grouped.product) : null;
      var bugsHtml = summaries && summaries.bugs ? renderFeedbackSummary(summaries.bugs, grouped.bugs) : null;
      var correctionsHtml = summaries && summaries.corrections ? renderFeedbackSummary(summaries.corrections, grouped.corrections) : null;

      // Fall back to raw for any track without summaries
      if (!productHtml) productHtml = renderRawFeedback(grouped.product);
      if (!bugsHtml) bugsHtml = renderRawFeedback(grouped.bugs);
      if (!correctionsHtml) correctionsHtml = renderRawFeedback(grouped.corrections);

      if (productBody) productBody.innerHTML = productHtml;
      if (bugsBody) bugsBody.innerHTML = bugsHtml;
      if (correctionsBody) correctionsBody.innerHTML = correctionsHtml;

      if (loading) loading.style.display = 'none';
      if (content) content.style.display = '';
      wireInsightsActions();
      wireSummaryToggles();

    } catch (e) {
      if (loading) loading.innerHTML = '<p style="color:#ef4444;text-align:center;padding:40px 0;">Failed to load feedback data.</p>';
    }
  }

  // ── Feedback rendering helpers ──────────────────────────────

  /** Try to parse JSON feedback text and render structured fields */
  function formatFeedbackText(rawText) {
    try {
      var obj = JSON.parse(rawText);
      var html = '';
      if (obj.summary) html += '<div class="feedback-item-summary">' + escapeHtml(obj.summary) + '</div>';
      else if (obj.userMessage) html += '<div class="feedback-item-summary">' + escapeHtml(obj.userMessage) + '</div>';
      if (obj.summary && obj.userMessage) html += '<div class="feedback-item-user-msg">' + escapeHtml(obj.userMessage) + '</div>';
      if (obj.technicalMessage) html += '<div class="feedback-item-detail">' + escapeHtml(obj.technicalMessage) + '</div>';
      return html || '<div class="feedback-item-summary">' + escapeHtml(rawText) + '</div>';
    } catch (_) {
      return '<div class="feedback-item-summary">' + escapeHtml(rawText) + '</div>';
    }
  }

  /** Build badge HTML for section and type */
  function feedbackBadges(item) {
    var html = '<div class="feedback-item-badges">';
    var section = item.section || '';
    var type = item.type || 'product';
    if (section) html += '<span class="feedback-badge feedback-badge-section">' + escapeHtml(section) + '</span>';
    html += '<span class="feedback-badge feedback-badge-type feedback-badge-' + escapeHtml(type) + '">' + escapeHtml(type) + '</span>';
    html += '</div>';
    return html;
  }

  /** Build per-item action buttons (move + delete) */
  function feedbackActions(itemId, currentType) {
    var types = ['product', 'bug', 'correction'];
    var moveOptions = types.filter(function (t) { return t !== currentType; });
    var html = '<div class="feedback-item-actions">';
    html += '<div class="feedback-move-group">';
    moveOptions.forEach(function (t) {
      var label = t === 'product' ? 'feedback' : t === 'correction' ? 'correction' : 'bug';
      html += '<button class="feedback-action-btn feedback-action-move" data-id="' + escapeHtml(itemId) + '" data-move-to="' + t + '" title="Move to ' + label + '">\u2192 ' + label + '</button>';
    });
    html += '</div>';
    html += '<button class="feedback-action-btn feedback-action-delete" data-id="' + escapeHtml(itemId) + '" title="Remove">REMOVE</button>';
    html += '</div>';
    return html;
  }

  function renderRawFeedback(items) {
    if (!items.length) return '<p style="color:#71717a;padding:20px 0;">No data yet.</p>';
    return items.map(function (item) {
      var id = item.id || '';
      var type = item.type || 'product';
      var rawText = item.text || item.rawText || item.raw_text || '';
      var html = '<div class="feedback-item" data-id="' + escapeHtml(id) + '">';
      html += '<div class="feedback-item-header">';
      html += feedbackBadges(item);
      if (id) html += feedbackActions(id, type);
      html += '</div>';
      html += formatFeedbackText(rawText);
      var name = item.submitterName || item.submitter_name;
      if (name) html += '<div class="feedback-item-submitter">' + escapeHtml(name) + '</div>';
      html += '</div>';
      return html;
    }).join('');
  }

  /** Wire delete and move click handlers inside the insights overlay */
  function wireInsightsActions() {
    var overlay = document.getElementById('insights-overlay');
    if (!overlay) return;

    overlay.querySelectorAll('.feedback-action-delete').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.dataset.id;
        if (!id) return;
        btn.disabled = true;
        btn.textContent = '...';
        try {
          await fetch(CHATBOT_PROXY + '/protoguide/feedback/' + encodeURIComponent(id), { method: 'DELETE', headers: getAuthHeaders() });
          var item = btn.closest('.feedback-item');
          if (item) item.remove();
        } catch (e) {
          console.error('Delete feedback failed:', e);
          btn.disabled = false;
          btn.textContent = 'REMOVE';
        }
      });
    });
    overlay.querySelectorAll('.feedback-action-move').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.dataset.id;
        var newType = btn.dataset.moveTo;
        if (!id || !newType) return;
        btn.disabled = true;
        try {
          await fetch(CHATBOT_PROXY + '/protoguide/feedback/' + encodeURIComponent(id), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ type: newType })
          });
          await loadFeedbackInsights();
        } catch (e) {
          console.error('Move feedback failed:', e);
          btn.disabled = false;
        }
      });
    });
  }

  /** Wire expand/collapse toggles on summary items to show raw source submissions */
  function wireSummaryToggles() {
    var overlay = document.getElementById('insights-overlay');
    if (!overlay) return;
    overlay.querySelectorAll('.feedback-summary-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sources = btn.nextElementSibling;
        if (!sources) return;
        var open = sources.style.display !== 'none';
        sources.style.display = open ? 'none' : '';
        btn.textContent = btn.textContent.replace(open ? '\u25be' : '\u25b8', open ? '\u25b8' : '\u25be');
      });
    });
  }

  // ── Rebuild buttons ──────────────────────────────────────────
  document.querySelectorAll('.guide-feedback-rebuild').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      var track = btn.dataset.track;
      if (!track) return;
      btn.disabled = true;
      var origText = btn.textContent;
      btn.textContent = 'Rebuilding\u2026';
      try {
        await fetch(CHATBOT_PROXY + '/protoguide/feedback/summary?action=rebuild&track=' + encodeURIComponent(track), {
          method: 'POST',
          headers: getAuthHeaders()
        });
        await loadFeedbackInsights();
      } catch (e) {
        console.error('Rebuild failed:', e);
      }
      btn.disabled = false;
      btn.textContent = origText;
    });
  });

  var rebuildAllBtn = document.getElementById('insights-rebuild-all');
  if (rebuildAllBtn) {
    rebuildAllBtn.addEventListener('click', async function () {
      rebuildAllBtn.disabled = true;
      rebuildAllBtn.textContent = 'Rebuilding\u2026';
      try {
        var tracks = ['product', 'bugs', 'corrections'];
        for (var i = 0; i < tracks.length; i++) {
          await fetch(CHATBOT_PROXY + '/protoguide/feedback/summary?action=rebuild&track=' + tracks[i], {
            method: 'POST',
            headers: getAuthHeaders()
          });
        }
        await loadFeedbackInsights();
      } catch (e) {
        console.error('Rebuild all failed:', e);
      }
      rebuildAllBtn.disabled = false;
      rebuildAllBtn.textContent = 'Rebuild All';
    });
  }

  // ── Field Group Modal ──────────────────────────────────────

  var fieldGroupModal = document.getElementById('field-group-modal');
  var fieldGroupModalClose = document.getElementById('field-group-modal-close');

  if (fieldGroupModalClose) {
    fieldGroupModalClose.addEventListener('click', () => {
      if (fieldGroupModal) fieldGroupModal.style.display = 'none';
    });
  }
  if (fieldGroupModal) {
    fieldGroupModal.addEventListener('click', (e) => {
      if (e.target === fieldGroupModal) fieldGroupModal.style.display = 'none';
    });
  }

  // ── Event tracking (inlined from original guide-adapter.js) ─────────
  (function setupEventTracking() {
    // Click tracking
    document.addEventListener('click', function(e) {
      // Skip clicks inside ProtoGuide panel
      if (e.target.closest('.ai-panel, .guide-insights-overlay, .modal-overlay, .guide-popout-overlay')) return;
      var el = e.target.closest('button, a, [role="button"], .nav-item, .filter-chip, .sub-nav-tab, .widget-card, .kpi-card');
      if (!el) return;
      var label = el.textContent.trim().substring(0, 80);
      var tag = el.tagName.toLowerCase();
      logAction({ type: 'click', detail: 'Click: ' + tag + ' \u2014 ' + label });
    }, true);

    // Navigation tracking
    window.addEventListener('popstate', function() {
      _lastPrototypeView = location.pathname + location.hash;
      logAction({ type: 'navigate', detail: 'Navigate: ' + _lastPrototypeView });
    });
    window.addEventListener('hashchange', function() {
      _lastPrototypeView = location.pathname + location.hash;
      logAction({ type: 'navigate', detail: 'Navigate: ' + _lastPrototypeView });
    });
  })();

  // ── Prototype Walkthrough (migrated from app.js) ─────────
  (function() {
    const ONBOARDING_KEY = 'trengo_onboarding_done';
    const AI_SETUP_MODE_KEY = 'trengo_ai_setup_mode';
    const WALKTHROUGH_TITLE = 'Prototype Walkthrough';
    const WALKTHROUGH_SUBTITLE = 'Internal only. Quick context for reviewers providing feedback.';
    const ONBOARDING_STEPS = [
      {
        text: 'This prototype explores a customisable analytics model with five broadly applicable default sections. Focus feedback on the overall structure, logic, and decisions it supports.'
      },
      {
        text: 'ProtoGuide \u2014 the panel on the right \u2014 answers concept questions and collects your feedback. Use the icons below its header for settings.'
      },
      {
        text: 'The default navigation is only a starting point. The model is designed to be customised to each company\u2019s language, structure, and priorities. In edit mode, users can also add, remove, reorder, and resize charts.'
      }
    ];

    let onboardingStep = 0;
    const overlay       = document.getElementById('onboarding-overlay');
    const stepsContainer = document.getElementById('onboarding-steps');
    let onboardingBodyText = null;
    let onboardingSkipBtn = null;
    let onboardingNextBtn = null;
    let onboardingDots = [];

    function animateStepText() {
      if (!onboardingBodyText) return;
      onboardingBodyText.classList.remove('onboarding-step-text-enter');
      void onboardingBodyText.offsetWidth;
      onboardingBodyText.classList.add('onboarding-step-text-enter');
    }

    function updateControls() {
      if (!onboardingSkipBtn || !onboardingNextBtn) return;
      const isLastStep = onboardingStep === ONBOARDING_STEPS.length - 1;
      onboardingSkipBtn.classList.toggle('hidden', isLastStep);
      onboardingSkipBtn.disabled = isLastStep;
      onboardingNextBtn.innerHTML = isLastStep
        ? '<span class="onboarding-next-text">Done</span><svg class="onboarding-next-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<span class="onboarding-next-text">Next</span><svg class="onboarding-next-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';
    }

    function updateDots() {
      onboardingDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === onboardingStep);
      });
    }

    function showStep(index, { animate = true } = {}) {
      onboardingStep = index;
      if (onboardingBodyText) {
        onboardingBodyText.textContent = ONBOARDING_STEPS[index].text;
        if (animate) animateStepText();
        else onboardingBodyText.classList.remove('onboarding-step-text-enter');
      }
      updateControls();
      updateDots();
    }

    function nextOnboardingStep() {
      const nextIndex = onboardingStep + 1;
      if (nextIndex >= ONBOARDING_STEPS.length) {
        closeOnboarding();
        return;
      }
      showStep(nextIndex);
    }

    function closeOnboarding() {
      overlay.classList.add('closing');
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('closing');
        stepsContainer.innerHTML = '';
        onboardingBodyText = null;
        onboardingSkipBtn = null;
        onboardingNextBtn = null;
        onboardingDots = [];
      }, 350);
    }

    function showOnboarding() {
      stepsContainer.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'onboarding-step-card';

      const header = document.createElement('div');
      header.className = 'onboarding-card-header';

      const title = document.createElement('h2');
      title.className = 'onboarding-title';
      title.textContent = WALKTHROUGH_TITLE;

      const subtitle = document.createElement('p');
      subtitle.className = 'onboarding-subtitle';
      subtitle.textContent = WALKTHROUGH_SUBTITLE;

      header.appendChild(title);
      header.appendChild(subtitle);
      card.appendChild(header);

      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'onboarding-step-body';

      const bodyTextWrap = document.createElement('div');
      bodyTextWrap.className = 'onboarding-step-text-wrap';

      const body = document.createElement('p');
      body.className = 'onboarding-step-text';
      body.setAttribute('aria-live', 'polite');
      bodyTextWrap.appendChild(body);
      bodyWrap.appendChild(bodyTextWrap);
      card.appendChild(bodyWrap);

      const footer = document.createElement('div');
      footer.className = 'onboarding-card-footer';

      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'onboarding-dots';
      onboardingDots = ONBOARDING_STEPS.map(() => {
        const dot = document.createElement('div');
        dot.className = 'onboarding-dot';
        dotsWrap.appendChild(dot);
        return dot;
      });

      const skipBtn = document.createElement('button');
      skipBtn.className = 'onboarding-skip';
      skipBtn.innerHTML = 'Skip intro <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      skipBtn.addEventListener('click', closeOnboarding);

      const nextBtn = document.createElement('button');
      nextBtn.className = 'onboarding-next';
      nextBtn.addEventListener('click', nextOnboardingStep);

      footer.appendChild(dotsWrap);
      footer.appendChild(skipBtn);
      footer.appendChild(nextBtn);
      card.appendChild(footer);

      stepsContainer.appendChild(card);
      onboardingBodyText = body;
      onboardingSkipBtn = skipBtn;
      onboardingNextBtn = nextBtn;
      onboardingStep = 0;
      overlay.classList.remove('closing');
      overlay.style.display = 'block';
      showStep(0, { animate: false });
    }

    function initOnboarding() {
      if (localStorage.getItem(ONBOARDING_KEY)) return;
      if (typeof AdminAssistant !== 'undefined' && localStorage.getItem(AI_SETUP_MODE_KEY) !== 'assistant') return;

      const waitForReady = () => {
        const analyticsPage = document.getElementById('analytics-page');
        if (analyticsPage && analyticsPage.style.display !== 'none') {
          const overviewContent = document.querySelector('.section-content[data-section="overview"]');
          if (overviewContent && !overviewContent.classList.contains('loaded')) {
            if (window.mountSection) window.mountSection('overview');
          }
          setTimeout(showOnboarding, 100);
        } else {
          setTimeout(waitForReady, 200);
        }
      };
      setTimeout(waitForReady, 300);
    }

    window.triggerWalkthrough = function() {
      localStorage.removeItem(ONBOARDING_KEY);
      const overviewContent = document.querySelector('.section-content[data-section="overview"]');
      if (overviewContent && !overviewContent.classList.contains('loaded') && window.mountSection) window.mountSection('overview');
      setTimeout(showOnboarding, 300);
    };

    initOnboarding();
  })();

  // ── Init ───────────────────────────────────────────────────
  (async function init() {
    setPanelState('chat');

    // Check for cached auth
    var cached = localStorage.getItem('protoguide_user');
    if (!cached) {
      window.location.href = 'protoguide-login.html';
      return;
    }

    try {
      currentUser = JSON.parse(cached);
    } catch (e) {
      localStorage.removeItem('protoguide_user');
      window.location.href = 'protoguide-login.html';
      return;
    }

    // Verify token is still valid
    var token = localStorage.getItem('protoguide_token');
    if (token) {
      try {
        var checkResp = await fetch(CHATBOT_PROXY + '/protoguide/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, idToken: token })
        });
        if (checkResp.ok) {
          var userData = await checkResp.json();
          currentUser.role = userData.role;
          localStorage.setItem('protoguide_user', JSON.stringify(currentUser));
        } else {
          // Token expired — redirect to login for fresh token
          localStorage.removeItem('protoguide_user');
          localStorage.removeItem('protoguide_token');
          window.location.href = 'protoguide-login.html';
          return;
        }
      } catch (e) {
        console.warn('ProtoGuide: auth check failed (offline?), using cached role');
      }
    }

    // Update UI for role
    updateSettingsRow();

    // Title
    document.querySelectorAll('.ai-panel-title-ask').forEach(function(el) { el.textContent = 'Proto'; });
    document.querySelectorAll('.ai-panel-title-ai').forEach(function(el) { el.textContent = 'Guide'; });

    // User menu email
    var emailEl = document.getElementById('user-menu-email');
    if (emailEl) emailEl.textContent = currentUser.email;

    // Chat is always enabled
    syncChatInputState(true);

    // Pick up deferred meta-start init from AdminAssistant
    if (window._pendingMetaStartInit) {
      delete window._pendingMetaStartInit;
      initMetaStartScreen();
      initRoleSelection();
      wireMetaStartContinue();
    }

    // Welcome message
    addBubble("Hi! I'm ProtoGuide \u2014 ask me anything about this analytics prototype.", 'assistant');

    // Track initial view
    _lastPrototypeView = location.pathname + location.hash;
    _lastPrototypeTitle = document.title;
  })();

})();
