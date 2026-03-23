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
      const api = window._prototypeGuideAPI;
      if (api) api.triggerAction('reset-all');
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
    else if (msg.type === 'guide:action') api.triggerAction(msg.actionId);
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
    html += '<div class="guide-setting-block"><button class="guide-action-btn" id="settings-manage-teams">Manage Teams</button></div>';
    html += '<div class="guide-setting-block"><button class="guide-action-btn" id="settings-reset-onboarding">Reset Onboarding</button></div>';
    html += '<div class="guide-setting-block"><button class="guide-action-btn guide-action-btn--danger" id="settings-reset-all">Reset Everything</button></div>';

    // Manage Users (admin only)
    if (currentUser && hasMinRole(currentUser.role, 'admin')) {
      html += '<div class="guide-popout-divider"></div>';
      html += '<div class="guide-setting-block"><button class="guide-action-btn" id="settings-manage-users">Manage Users</button></div>';
    }

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
      openThresholdsModal();
    });

    var manageTeamsBtn = document.getElementById('settings-manage-teams');
    if (manageTeamsBtn) manageTeamsBtn.addEventListener('click', function() {
      postToPrototype({ type: 'guide:action', actionId: 'manage-teams' });
    });

    var resetOnboardingBtn = document.getElementById('settings-reset-onboarding');
    if (resetOnboardingBtn) resetOnboardingBtn.addEventListener('click', function() {
      postToPrototype({ type: 'guide:action', actionId: 'reset-onboarding' });
    });

    var resetAllBtn = document.getElementById('settings-reset-all');
    if (resetAllBtn) resetAllBtn.addEventListener('click', function() {
      if (confirm('Reset all prototype state? This cannot be undone.')) {
        postToPrototype({ type: 'guide:action', actionId: 'reset-all' });
      }
    });

    var manageUsersBtn = document.getElementById('settings-manage-users');
    if (manageUsersBtn) manageUsersBtn.addEventListener('click', function() {
      closeAllOverlays();
      openManageUsersModal();
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
        fetch(CHATBOT_PROXY + '/protoguide/domains', { headers: getAuthHeaders() }),
        fetch(CHATBOT_PROXY + '/protoguide/users', { headers: getAuthHeaders() })
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
      html += '<input type="text" id="new-domain-input" placeholder="e.g. company.com" style="flex:1;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;">';
      html += '<button id="add-domain-btn" style="padding:6px 12px;background:#374151;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">Add</button>';
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
          await fetch(CHATBOT_PROXY + '/protoguide/domains/' + encodeURIComponent(btn.dataset.domain), { method: 'DELETE', headers: getAuthHeaders() });
          openManageUsersModal(); // refresh
        });
      });

      var addDomainBtn = document.getElementById('add-domain-btn');
      if (addDomainBtn) {
        addDomainBtn.addEventListener('click', async function() {
          var input = document.getElementById('new-domain-input');
          var domain = input.value.trim();
          if (!domain) return;
          await fetch(CHATBOT_PROXY + '/protoguide/domains', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ domain }) });
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
            await fetch(CHATBOT_PROXY + '/protoguide/users', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ email: email, role: role }) });
            openManageUsersModal(); // refresh
          } catch(e) {
            addUserBtn.disabled = false;
          }
        });
      }

      // Wire role change dropdowns
      body.querySelectorAll('.mu-inline-role[data-role-email]').forEach(function(sel) {
        sel.addEventListener('change', async function() {
          await fetch(CHATBOT_PROXY + '/protoguide/users', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ email: sel.dataset.roleEmail, role: sel.value }) });
        });
      });

      // Wire remove user buttons
      body.querySelectorAll('.mu-remove-btn[data-remove-email]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          if (!confirm('Remove ' + btn.dataset.removeEmail + '?')) return;
          await fetch(CHATBOT_PROXY + '/protoguide/users/' + encodeURIComponent(btn.dataset.removeEmail), { method: 'DELETE', headers: getAuthHeaders() });
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

  async function loadFeedbackInsights() {
    const loading = document.getElementById('insights-loading');
    const empty = document.getElementById('insights-empty');
    const content = document.getElementById('insights-content');

    if (loading) loading.style.display = '';
    if (empty) empty.style.display = 'none';
    if (content) content.style.display = 'none';

    try {
      const allSubmissions = await fetchFeedback();

      if (!allSubmissions.length) {
        if (loading) loading.style.display = 'none';
        if (empty) empty.style.display = '';
        return;
      }

      const grouped = { product: [], bugs: [], corrections: [] };
      allSubmissions.forEach(s => {
        if (s.deleted) return;
        if (s.type === 'bug') grouped.bugs.push(s);
        else if (s.type === 'correction') grouped.corrections.push(s);
        else grouped.product.push(s);
      });

      var productBody = document.getElementById('insights-product-body');
      var bugsBody = document.getElementById('insights-bugs-body');
      var correctionsBody = document.getElementById('insights-corrections-body');

      if (productBody) productBody.innerHTML = renderRawFeedback(grouped.product);
      if (bugsBody) bugsBody.innerHTML = renderRawFeedback(grouped.bugs);
      if (correctionsBody) correctionsBody.innerHTML = renderRawFeedback(grouped.corrections);

      if (loading) loading.style.display = 'none';
      if (content) content.style.display = '';
      wireInsightsActions();

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
      var rawText = item.rawText || item.raw_text || '';
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
          // Token invalid, but allow offline usage with cached role
          console.warn('ProtoGuide: token verification failed, using cached role');
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

    // Welcome message
    addBubble("Hi! I'm ProtoGuide \u2014 ask me anything about this analytics prototype.", 'assistant');

    // Track initial view
    _lastPrototypeView = location.pathname + location.hash;
    _lastPrototypeTitle = document.title;
  })();

})();
