/* ============================================================
   TRENGO ANALYTICS PROTOTYPE — Widget Catalog
   ============================================================
   Static definitions for all available widgets, sections (tabs),
   and teams. Extracted from app.js so they can be referenced by
   the AI onboarding agent and kept separate from runtime logic.
   ============================================================ */

// ── DEFAULT TABS / SECTIONS ───────────────────────────────────
const DEFAULT_TABS = [
  { id: 'overview',   label: 'Overview',   category: 'overview',   isDefault: true },
  { id: 'understand', label: 'Understand', category: 'understand', isDefault: true },
  { id: 'operate',    label: 'Operate',    category: 'operate',    isDefault: true },
  { id: 'improve',    label: 'Improve',    category: 'improve',    isDefault: true },
  { id: 'automate',   label: 'Automate',   category: 'automate',   isDefault: true },
];

// ── TEAM DEFINITIONS ──────────────────────────────────────────
const TEAMS_DATA = [
  { name: 'Sales team',    members: ['Tycho', 'Kat', 'Raymond'] },
  { name: 'SMB Central',   members: ['Greg Aquino', 'Deborah Pia'] },
  { name: 'Mid-Market',    members: ['Federico Lai', 'Rowan Milwid'] },
  { name: 'Expansion',     members: ['Dmytro Hachok', 'Victor Montala'] },
  { name: 'Retention',     members: ['Isabella Escobar', 'Greg Aquino', 'Deborah Pia'] },
  { name: 'Core Services', members: ['Rowan Milwid', 'Federico Lai', 'Donovan van der Weerd'] },
];

// ── WIDGET DEFINITIONS ─────────────────────────────────────────
// vis: 'always' | 'default' | 'hidden'  (base visibility before state logic)
//
// Each widget can have a `states` object describing per-state overrides.
// Keys are "support_supervisor", "support_agent", "sales_supervisor", "sales_agent".
// Values: 'show' | 'hide' | 'emphasize' | 'deemphasize'
// If a state key is absent the base `vis` applies.
//
// `scopeLabel` — optional object { supervisor: '...', agent: '...' } to swap
//   the KPI sub-label depending on role.
// `tooltipByState` — optional object keyed same as `states` to swap tooltip text.
//
// `tags` — semantic tags describing purpose, domain, and decision area.
//   Used by the AI agent for widget-to-tab placement decisions.

function getSectionForWidget(widgetId) {
  for (const [sid, ws] of Object.entries(WIDGETS)) {
    if (ws.some(w => w.id === widgetId)) return sid;
  }
  return null;
}

const WIDGETS = {
  // ─── OVERVIEW ────────────────────
  overview: [
    { id: 'ov-open-tickets', title: 'Open tickets', vis: 'always', type: 'kpi',
      tags: ['overview', 'volume', 'capacity', 'operational', 'backlog', 'support', 'monitoring'],
      tooltip: 'Total tickets currently open across all channels. A rising number may indicate capacity issues.',
      scopeLabel: { supervisor: 'Across all channels', agent: 'Your open tickets' },
      tooltipByState: {
        support_agent: 'Tickets currently assigned to you. Focus on the oldest first.',
        sales_supervisor: 'Open contacts across the pipeline. Monitor for stale entries.',
        sales_agent: 'Your open contacts. Prioritize those closest to a next step.'
      }
    },
    { id: 'ov-assigned-tickets', title: 'Assigned tickets', vis: 'default', type: 'kpi',
      tags: ['overview', 'volume', 'workload', 'operational', 'support', 'agent-facing'],
      tooltip: 'Tickets currently assigned to an agent. Compare with open tickets to spot unassigned backlog.',
      scopeLabel: { supervisor: 'Currently assigned', agent: 'Assigned to you' },
      states: { sales_supervisor: 'show', sales_agent: 'show' }
    },
    { id: 'ov-first-response', title: 'First response time', vis: 'default', type: 'kpi',
      tags: ['overview', 'response-time', 'performance', 'support', 'customer-experience', 'quality'],
      tooltip: 'Median time to first agent reply. This directly impacts customer perception of responsiveness.',
      scopeLabel: { supervisor: 'Median — all agents', agent: 'Your median' },
      states: { sales_supervisor: 'deemphasize', sales_agent: 'deemphasize' }
    },
    { id: 'ov-escalation-rate', title: 'Escalation rate (AI → human)', vis: 'default', type: 'kpi',
      tags: ['overview', 'escalation', 'ai', 'handoff', 'automation', 'quality', 'monitoring'],
      tooltip: 'Percentage of AI-handled tickets escalated to a human agent. Rising rates suggest knowledge or confidence gaps in AI.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'ov-resolution-time', title: 'Resolution time', vis: 'default', type: 'kpi',
      tags: ['overview', 'resolution', 'performance', 'efficiency', 'support', 'operational'],
      tooltip: 'Median time from ticket creation to resolution. Long times signal process or knowledge gaps.',
      scopeLabel: { supervisor: 'Median — all agents', agent: 'Your median' },
      states: { sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'ov-pipeline-value', title: 'Pipeline value', vis: 'default', type: 'kpi',
      tags: ['overview', 'sales', 'pipeline', 'revenue', 'deals'],
      tooltip: 'Total value of all open deals in the pipeline.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'ov-win-rate', title: 'Win rate', vis: 'default', type: 'kpi',
      tags: ['overview', 'sales', 'conversion', 'performance', 'deals', 'revenue'],
      tooltip: 'Percentage of opportunities that resulted in a closed-won deal.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'ov-avg-deal-size', title: 'Avg deal size', vis: 'default', type: 'kpi',
      tags: ['overview', 'sales', 'revenue', 'deals', 'performance'],
      tooltip: 'Average revenue per closed-won deal over the selected period.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'ov-avg-sales-cycle', title: 'Avg sales cycle', vis: 'default', type: 'kpi',
      tags: ['overview', 'sales', 'efficiency', 'deals', 'performance', 'pipeline'],
      tooltip: 'Average number of days from deal creation to close (won or lost).',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'ov-tickets-by-hour', title: 'Tickets created by hour', vis: 'default', type: 'bar-chart', fullWidth: true, sizeClass: 'large',
      tags: ['overview', 'volume', 'demand', 'staffing', 'trends', 'support', 'capacity'],
      tooltip: 'Hourly distribution of new tickets. Use this to plan staffing and identify peak demand windows.',
      states: { support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'ov-vc-missed-calls', title: 'Missed calls', vis: 'default', type: 'kpi',
      tags: ['overview', 'voice', 'volume', 'capacity', 'staffing', 'monitoring', 'routing'],
      tooltip: 'Total calls that rang without being answered. A rising trend signals understaffing or poor routing.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'ov-vc-total-calls', title: 'Total calls', vis: 'default', type: 'kpi',
      tags: ['overview', 'voice', 'volume', 'operational'],
      tooltip: 'Total calls handled across all voice channels in the selected period. Includes inbound and outbound.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'ov-intent-trends', title: 'Intent trend highlights', vis: 'default', type: 'list', halfWidth: true,
      tags: ['overview', 'intents', 'trends', 'insights', 'demand', 'customer-experience'],
      tooltip: 'Top rising and declining customer intents. Helps you anticipate demand shifts before they become critical.',
      drill: { label: 'See why →', target: 'understand' },
      states: { support_agent: 'hide', sales_supervisor: 'emphasize', sales_agent: 'hide' }
    },
    { id: 'ov-knowledge-gaps', title: 'Knowledge gap alerts', vis: 'hidden', type: 'kpi',
      tags: ['overview', 'knowledge', 'ai', 'improvement', 'quality', 'monitoring'],
      tooltip: 'Count of unresolved or fallback cases where the AI lacked sufficient knowledge to respond.',
      drill: { label: 'Improve this →', target: 'improve' },
      states: { support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'ov-exceptions', title: 'Exceptions requiring attention', vis: 'hidden', type: 'list', halfWidth: true,
      tags: ['overview', 'anomalies', 'monitoring', 'automation', 'real-time'],
      tooltip: 'System-detected anomalies or risks that may need immediate attention.',
      drill: { label: 'Check automation →', target: 'automate' },
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'ov-vc-calls-by-hour', title: 'Calls by hour of day', vis: 'default', type: 'bar-chart', fullWidth: true, sizeClass: 'large',
      tags: ['overview', 'voice', 'volume', 'demand', 'staffing', 'trends', 'capacity'],
      tooltip: 'Hourly distribution of call volume — today vs 30-day average. Compare with ticket demand peaks to plan staffing across channels.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
  ],
  // ─── UNDERSTAND ──────────────────
  understand: [
    { id: 'un-tickets-created', title: 'Tickets created', vis: 'always', type: 'line-chart', halfWidth: true,
      tags: ['insights', 'volume', 'trends', 'support', 'demand'],
      tooltip: 'Trend of new tickets created over the selected period.',
      states: { sales_supervisor: 'deemphasize', sales_agent: 'hide' }
    },
    { id: 'un-leads-created', title: 'New leads', vis: 'default', type: 'bar-chart', halfWidth: true,
      tags: ['insights', 'sales', 'leads', 'volume', 'channels', 'contact'],
      tooltip: 'New contacts (leads) created per day, broken down by channel.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'un-deals-created', title: 'Deals created', vis: 'default', type: 'bar-chart', halfWidth: true,
      tags: ['insights', 'sales', 'deals', 'volume', 'pipeline', 'channels'],
      tooltip: 'New deals created per day, broken down by channel.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'un-sales-funnel', title: 'Sales pipeline funnel', vis: 'default', type: 'funnel', fullWidth: true, sizeClass: 'large',
      tags: ['insights', 'sales', 'pipeline', 'funnel', 'conversion', 'deals'],
      tooltip: 'Deal count at each pipeline stage. Declining bars show conversion drop-off between stages.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'un-deals-won-by-channel', title: 'Deals closed by channel (Won)', vis: 'default', type: 'doughnut-chart',
      tags: ['insights', 'sales', 'deals', 'channels', 'conversion', 'revenue'],
      tooltip: 'Breakdown of closed-won deals by last communication channel. Shows which channels drive successful closes.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'un-deals-by-channel', title: 'Deals created by channel', vis: 'default', type: 'doughnut-chart',
      tags: ['insights', 'sales', 'deals', 'channels', 'leads'],
      tooltip: 'Distribution of newly created deals by the contact\'s entry channel.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'un-entry-channels', title: 'Entry channels', vis: 'always', type: 'bar-chart', halfWidth: true,
      tags: ['insights', 'channels', 'volume', 'contact', 'demand'],
      tooltip: 'Distribution of tickets and contacts by channel (email, WhatsApp, chat, etc.).',
      tooltipByState: {
        sales_supervisor: 'Which channels bring in new contacts and pipeline entries.',
        sales_agent: 'Where your contacts are coming from.'
      },
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'un-vc-inbound-outbound', title: 'Inbound vs outbound calls', vis: 'default', type: 'bar-chart', halfWidth: true,
      tags: ['insights', 'voice', 'volume', 'channels', 'operational'],
      tooltip: 'Daily split of inbound calls (connected vs missed) and outbound calls (connected vs not connected). Complements the entry channels breakdown with voice-specific composition.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'un-vc-duration-inbound-outbound', title: 'Duration: inbound vs outbound', vis: 'default', type: 'bar-chart', halfWidth: true,
      tags: ['insights', 'voice', 'efficiency', 'performance', 'operational'],
      tooltip: 'Daily comparison of average call duration for inbound and outbound calls. Pairs with the inbound/outbound volume split above.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'deemphasize', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'un-new-returning', title: 'New vs returning contacts', vis: 'default', type: 'doughnut-chart',
      tags: ['insights', 'contact', 'customer-experience', 'support', 'sales', 'trends'],
      tooltip: 'Proportion of first-time vs repeat contacts. High repeat rates may indicate unresolved issues.',
      states: { sales_supervisor: 'emphasize', sales_agent: 'show' }
    },
    { id: 'un-intent-clusters', title: 'Intent clusters', vis: 'default', type: 'bar-chart', halfWidth: true, sizeClass: 'large',
      tags: ['insights', 'intents', 'customer-experience', 'demand', 'ai', 'trends'],
      tooltip: 'Primary reasons customers contact you, clustered by AI classification.',
      states: { support_agent: 'hide', sales_supervisor: 'emphasize', sales_agent: 'hide' }
    },
    { id: 'un-intent-trends', title: 'Intent trends over time', vis: 'default', type: 'line-chart', fullWidth: true, sizeClass: 'large',
      tags: ['insights', 'intents', 'trends', 'demand', 'customer-experience'],
      tooltip: 'How top intents change over time. Use this to spot emerging patterns.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'un-emerging-intents', title: 'Emerging intents', vis: 'hidden', type: 'list',
      tags: ['insights', 'intents', 'trends', 'anomalies', 'demand'],
      tooltip: 'New or rapidly growing intent clusters that have appeared recently.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'un-unknown-intents', title: 'Unknown / unclassified intents', vis: 'default', type: 'kpi',
      tags: ['insights', 'intents', 'ai', 'knowledge', 'quality', 'improvement'],
      tooltip: 'Tickets the AI could not classify. These represent gaps in your intent model.',
      states: { support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'un-escalations-intent', title: 'Escalations by intent', vis: 'hidden', type: 'bar-chart',
      tags: ['insights', 'escalation', 'intents', 'quality', 'handoff', 'ai'],
      tooltip: 'Which intents most frequently result in escalation. Shows where understanding breaks down.',
      states: { support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'un-vc-channel-performance', title: 'Voice channel performance', vis: 'default', type: 'table', fullWidth: true, sizeClass: 'large',
      tags: ['insights', 'voice', 'channels', 'performance', 'operational', 'supervisor-facing'],
      tooltip: 'Per-channel summary of key voice metrics. Compare channel performance and identify underperforming channels.',
      hideWhenChannelFiltered: true, hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
  ],
  // ─── OPERATE ─────────────────────
  operate: [
    { id: 'op-first-response', title: 'First response time', vis: 'always', type: 'kpi',
      tags: ['operational', 'response-time', 'performance', 'support', 'efficiency', 'sla'],
      tooltip: 'Median first response time for the selected period.',
      scopeLabel: { supervisor: 'Median — all agents', agent: 'Your median' },
      states: { sales_supervisor: 'deemphasize', sales_agent: 'deemphasize' }
    },
    { id: 'op-vc-time-to-answer', title: 'Time to answer', vis: 'default', type: 'kpi',
      tags: ['operational', 'voice', 'response-time', 'performance', 'efficiency'],
      tooltip: 'Average time from a call arriving to an agent answering. The voice equivalent of first response time.',
      scopeLabel: { supervisor: 'Avg — all agents', agent: 'Your average' },
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'show', sales_supervisor: 'show', sales_agent: 'show' }
    },
    { id: 'op-vc-call-duration-kpis', title: 'Call duration', vis: 'default', type: 'kpi-group',
      tags: ['operational', 'voice', 'efficiency', 'performance'],
      tooltip: 'Average, longest and shortest call duration this period. Pairs with time-to-answer as the two key per-call efficiency metrics.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'show', sales_supervisor: 'show', sales_agent: 'show' }
    },
    { id: 'op-resolution-time', title: 'Resolution time (tickets)', vis: 'always', type: 'kpi',
      tags: ['operational', 'resolution', 'performance', 'efficiency', 'support', 'quality'],
      tooltip: 'Median resolution time across all closed tickets.',
      scopeLabel: { supervisor: 'Median — all agents', agent: 'Your median' },
      states: { sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'op-created-closed', title: 'Created tickets vs Closed tickets', vis: 'default', type: 'line-chart', fullWidth: true, sizeClass: 'large',
      tags: ['operational', 'volume', 'backlog', 'capacity', 'trends', 'support'],
      tooltip: 'Compare inflow vs outflow. A widening gap means your backlog is growing.',
      states: { support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'op-reopened', title: 'Reopened tickets', vis: 'default', type: 'kpi',
      tags: ['operational', 'quality', 'resolution', 'improvement', 'support'],
      tooltip: 'Tickets that were reopened after being marked resolved. High numbers suggest premature closures.',
      scopeLabel: { supervisor: 'Reopened this period', agent: 'Your reopened tickets' },
      states: { sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'op-workload-agent', title: 'Workload by agent', vis: 'default', type: 'table', fullWidth: true, sizeClass: 'large',
      tags: ['operational', 'workload', 'team', 'staffing', 'agent-facing', 'capacity', 'coaching', 'supervisor-facing'],
      tooltip: 'Per-agent breakdown of key operational metrics.',
      states: { support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'op-sales-performance', title: 'Sales performance', vis: 'default', type: 'table', fullWidth: true, sizeClass: 'large',
      tags: ['operational', 'sales', 'performance', 'team', 'revenue', 'deals', 'leads', 'supervisor-facing'],
      tooltip: 'Per-agent sales performance: leads, deals created, pipeline value, revenue, and win rate.',
      states: { support_supervisor: 'hide', support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'op-channel-stage-matrix', title: 'Channel × stage', vis: 'default', type: 'table', fullWidth: true, sizeClass: 'large',
      tags: ['operational', 'sales', 'channels', 'pipeline', 'funnel', 'conversion', 'deals'],
      tooltip: 'Deal counts by channel and pipeline stage. Shows which channels drive deals furthest in the funnel.',
      states: { support_supervisor: 'hide', support_agent: 'hide' }
    },
    { id: 'op-vc-calls-by-team', title: 'Calls by team', vis: 'default', type: 'bar-chart', halfWidth: true,
      tags: ['operational', 'voice', 'volume', 'team', 'staffing', 'capacity', 'demand'],
      tooltip: 'Inbound and outbound call volume distributed by team. Voice equivalent of workload by agent.',
      hideWhenTeamFiltered: true, hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'op-vc-avg-wait-by-team', title: 'Average wait time by team', vis: 'default', type: 'bar-chart', halfWidth: true,
      tags: ['operational', 'voice', 'response-time', 'team', 'capacity', 'staffing', 'customer-experience'],
      tooltip: 'Average caller wait time per team before an agent answers. Helps identify which teams need more voice capacity.',
      hideWhenTeamFiltered: true, hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'op-vc-longest-wait', title: 'Longest wait time', vis: 'default', type: 'kpi',
      tags: ['operational', 'voice', 'response-time', 'monitoring', 'routing', 'capacity'],
      tooltip: 'The single longest wait time recorded this period. Outliers indicate routing or capacity failures.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'op-vc-duration-by-team', title: 'Call duration by team', vis: 'default', type: 'bar-chart', halfWidth: true,
      tags: ['operational', 'voice', 'efficiency', 'team', 'coaching', 'knowledge'],
      tooltip: 'Average call duration per team. Long durations may indicate complex queries or insufficient agent knowledge.',
      hideWhenTeamFiltered: true, hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'op-sla-compliance', title: 'SLA compliance', vis: 'default', type: 'progress',
      tags: ['operational', 'sla', 'compliance', 'quality', 'performance', 'support'],
      tooltip: 'Percentage of tickets meeting SLA targets for response and resolution.',
      scopeLabel: { supervisor: '87% of tickets within SLA', agent: '91% of your tickets within SLA' },
      states: { sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'op-bottlenecks', title: 'Ticket counts per status or stage', vis: 'always', type: 'bar-chart',
      tags: ['operational', 'backlog', 'capacity', 'efficiency', 'support', 'pipeline'],
      tooltip: 'Where tickets are getting stuck in your workflow.',
      states: { support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' },
      tooltipByState: { sales_supervisor: 'Where contacts are getting stuck in your pipeline stages.' }
    },
    { id: 'op-channel-perf', title: 'Performance by channel', vis: 'default', type: 'table', fullWidth: true, sizeClass: 'large',
      tags: ['operational', 'channels', 'performance', 'efficiency', 'supervisor-facing'],
      tooltip: 'Key metrics broken down by channel. Click a row to filter the entire view by that channel.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'op-capacity-demand', title: 'Capacity vs demand', vis: 'hidden', type: 'line-chart', halfWidth: true,
      tags: ['operational', 'capacity', 'demand', 'staffing', 'volume', 'trends'],
      tooltip: 'Volume of incoming work vs available agent capacity. Gaps indicate understaffing.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'op-vc-abandonment-trend', title: 'Call abandonment trend', vis: 'default', type: 'line-chart', halfWidth: true,
      tags: ['operational', 'voice', 'capacity', 'trends', 'customer-experience', 'staffing'],
      tooltip: 'Percentage of callers who hung up before being answered, plotted against total call volume. Rising abandon rate signals capacity shortfall.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'op-vc-callbacks-requested', title: 'Callback requests', vis: 'default', type: 'kpi',
      tags: ['operational', 'voice', 'demand', 'capacity', 'customer-experience'],
      tooltip: 'Callers who opted into a callback instead of waiting on hold. High numbers signal demand vs capacity mismatch.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
    { id: 'op-vc-agent-online-status', title: 'Agent online status', vis: 'default', type: 'agent-status',
      tags: ['operational', 'voice', 'real-time', 'staffing', 'monitoring', 'team', 'supervisor-facing'],
      tooltip: 'Current online status of agents across voice channels. Real-time availability view for supervisors.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'show', sales_agent: 'hide' }
    },
  ],
  // ─── IMPROVE ─────────────────────
  improve: [
    { id: 'im-csat', title: 'CSAT score', vis: 'always', type: 'kpi',
      tags: ['improvement', 'satisfaction', 'quality', 'feedback', 'customer-experience', 'survey'],
      tooltip: 'Customer Satisfaction score from survey responses.',
      states: { sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'im-response-rate', title: 'Response rate', vis: 'always', type: 'kpi',
      tags: ['improvement', 'survey', 'feedback', 'customer-experience'],
      tooltip: 'Percentage of delivered surveys that received a response.',
      states: { sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'im-vc-fcr-rate', title: 'First call resolution', vis: 'default', type: 'kpi',
      tags: ['improvement', 'voice', 'resolution', 'quality', 'efficiency', 'customer-experience'],
      tooltip: 'Percentage of calls resolved in a single call without a callback or follow-up ticket. The voice equivalent of CSAT.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'emphasize', support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'im-vc-call-ticket-rate', title: 'Call-to-ticket rate', vis: 'default', type: 'kpi',
      tags: ['improvement', 'voice', 'quality', 'coaching', 'knowledge', 'efficiency'],
      tooltip: 'Percentage of calls that result in a ticket being created afterward. High rates signal agents are not fully resolving on the call — a coaching or knowledge-base improvement signal.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'im-responses', title: 'CSAT Breakdown', vis: 'default', type: 'kpi-group',
      tags: ['improvement', 'satisfaction', 'feedback', 'survey', 'customer-experience'],
      tooltip: 'Breakdown of survey responses by sentiment.',
      states: { support_agent: 'show', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'im-satisfaction-score', title: 'Satisfaction score', vis: 'default', type: 'line-chart', halfWidth: true, sizeClass: 'large',
      tags: ['improvement', 'satisfaction', 'trends', 'quality', 'customer-experience', 'survey'],
      tooltip: 'CSAT trend over the selected period alongside survey volume.',
      states: { support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'im-surveys', title: 'Surveys received', vis: 'default', type: 'bar-chart', halfWidth: true,
      tags: ['improvement', 'survey', 'volume', 'feedback'],
      tooltip: 'Number of surveys received per day.',
      states: { support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'im-reopen-rate', title: 'Reopen rate', vis: 'default', type: 'kpi',
      tags: ['improvement', 'quality', 'resolution', 'support', 'operational'],
      tooltip: 'Percentage of resolved tickets that get reopened. A quality indicator.',
      scopeLabel: { supervisor: 'Of resolved tickets', agent: 'Of your resolved tickets' },
      states: {}
    },
    { id: 'im-knowledge-gaps', title: 'Knowledge gaps by intent', vis: 'hidden', type: 'bar-chart',
      tags: ['improvement', 'knowledge', 'ai', 'intents', 'coaching', 'quality'],
      tooltip: 'Which intents have the most knowledge gaps, driving poor outcomes.',
      states: { support_agent: 'show', sales_supervisor: 'hide', sales_agent: 'show' },
      tooltipByState: { support_agent: 'Knowledge gaps you encountered most often.' }
    },
    { id: 'im-suggested-knowledge', title: 'Suggested knowledge additions', vis: 'default', type: 'list-actions', halfWidth: true,
      tags: ['improvement', 'knowledge', 'ai', 'automation', 'coaching'],
      tooltip: 'AI-suggested knowledge base articles to fill gaps. Approve or reject each suggestion.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'im-opportunities', title: 'Opportunities backlog', vis: 'always', type: 'opportunities', fullWidth: true, sizeClass: 'large',
      tags: ['improvement', 'quality', 'insights', 'ai', 'coaching', 'supervisor-facing'],
      tooltip: 'Prioritized list of improvement opportunities identified by AI analysis.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
  ],
  // ─── AUTOMATE ────────────────────
  automate: [
    { id: 'au-ai-tickets', title: 'AI Agent tickets', vis: 'always', type: 'kpi',
      tags: ['automation', 'ai', 'volume', 'operational', 'performance'],
      tooltip: 'Total tickets handled or touched by AI agents.',
      scopeLabel: { supervisor: 'AI-handled tickets', agent: 'AI-handled on your behalf' },
      states: { sales_supervisor: 'show', sales_agent: 'show' }
    },
    { id: 'au-resolution-rate', title: 'Resolution rate (AI Agents)', vis: 'always', type: 'kpi',
      tags: ['automation', 'ai', 'resolution', 'performance', 'efficiency', 'quality'],
      tooltip: 'Percentage of AI-handled tickets fully resolved without human intervention.',
      states: { support_agent: 'deemphasize', sales_agent: 'deemphasize' }
    },
    { id: 'au-assistance-rate', title: 'Assistance rate (AI Agents)', vis: 'default', type: 'kpi',
      tags: ['automation', 'ai', 'performance', 'handoff', 'support'],
      tooltip: 'Percentage of tickets where AI assisted but did not fully resolve.',
      states: { support_agent: 'show', sales_agent: 'show' }
    },
    { id: 'au-open-ticket-rate', title: 'Open ticket rate (AI Agents)', vis: 'default', type: 'kpi',
      tags: ['automation', 'ai', 'backlog', 'monitoring', 'operational'],
      tooltip: 'Percentage of AI-assigned tickets still open without a response.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'au-vc-ivr-queue-time', title: 'Time in IVR / queue', vis: 'default', type: 'kpi',
      tags: ['automation', 'voice', 'efficiency', 'routing', 'customer-experience'],
      tooltip: 'Average time callers spend navigating IVR menus or waiting in queues before reaching an agent. High values indicate automation underperformance in the pre-agent layer.',
      hideWhenNonVoiceChannel: true,
      states: { support_supervisor: 'show', support_agent: 'hide', sales_supervisor: 'hide', sales_agent: 'hide' }
    },
    { id: 'au-journeys-success', title: 'Journeys success ratio', vis: 'default', type: 'progress',
      tags: ['automation', 'journeys', 'performance', 'efficiency', 'quality'],
      tooltip: 'Percentage of automation journeys that complete successfully.',
      states: { support_agent: 'hide', sales_supervisor: 'emphasize', sales_agent: 'hide' }
    },
    { id: 'au-journeys-escalations', title: 'Journeys escalations', vis: 'default', type: 'kpi',
      tags: ['automation', 'journeys', 'escalation', 'handoff', 'quality'],
      tooltip: 'Number of automation journeys that resulted in escalation to a human.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'au-handoff-reasons', title: 'Automation handoff reasons', vis: 'default', type: 'bar-chart', halfWidth: true, sizeClass: 'large',
      tags: ['automation', 'handoff', 'escalation', 'ai', 'insights', 'improvement'],
      tooltip: 'Why automation stopped and handed off to a human agent.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'au-conflicts', title: 'Automation conflicts', vis: 'hidden', type: 'list',
      tags: ['automation', 'journeys', 'ai', 'anomalies', 'monitoring'],
      tooltip: 'Cases where journeys and AI agents produced conflicting actions.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
    { id: 'au-safety', title: 'Safety and guardrail violations', vis: 'hidden', type: 'list',
      tags: ['automation', 'safety', 'guardrails', 'ai', 'compliance', 'monitoring'],
      tooltip: 'Intentional stops triggered by safety guardrails in automation.',
      states: { support_agent: 'hide', sales_agent: 'hide' }
    },
  ],

};

const DATA_WIDGET_TYPES = new Set([
  'kpi',
  'kpi-group',
  'bar-chart',
  'line-chart',
  'doughnut-chart',
  'funnel',
  'table',
  'list',
  'agent-status',
  'list-actions',
  'progress',
  'opportunities',
]);

const DEFAULT_WIDGET_QUERY_CONTEXT = ['customer', 'role', 'personaRole', 'lens', 'dateRange', 'team', 'channels'];

function createApiMapping(entity, metrics, extra = {}) {
  return {
    entity,
    metrics: Array.isArray(metrics) ? metrics.slice() : [metrics],
    ...extra,
  };
}

function createDataSpec(kind, options = {}) {
  return {
    kind,
    queryContext: (options.queryContext || DEFAULT_WIDGET_QUERY_CONTEXT).slice(),
    sourcePriority: (options.sourcePriority || ['api', 'mock']).slice(),
    exportShape: options.exportShape || kind,
    formatting: options.formatting || null,
    interactionHints: {
      supportsCsv: ['bar-chart', 'line-chart', 'doughnut-chart', 'table'].includes(kind),
      supportsNumbersView: ['bar-chart', 'line-chart', 'doughnut-chart'].includes(kind),
      supportsBarFilter: kind === 'bar-chart',
      ...options.interactionHints,
    },
    apiMapping: options.apiMapping || { widgetId: options.widgetId || null },
    mockResolverId: options.mockResolverId || options.widgetId || null,
  };
}

function defaultInlineTargetsForType(type) {
  switch (type) {
    case 'kpi': return ['primary', 'trend', 'extras'];
    case 'kpi-group': return ['groups'];
    case 'bar-chart':
    case 'line-chart':
    case 'doughnut-chart': return ['datasets', 'points', 'legend'];
    case 'funnel': return ['stages'];
    case 'table': return ['rows', 'cells'];
    case 'list':
    case 'list-actions': return ['items'];
    case 'agent-status': return ['items', 'badges'];
    case 'progress': return ['value', 'label'];
    case 'opportunities': return ['items', 'status'];
    default: return [];
  }
}

const WIDGET_DATA_SPECS = {
  'ov-open-tickets': createDataSpec('kpi', { widgetId: 'ov-open-tickets', formatting: 'count', apiMapping: createApiMapping('team_daily', 'open_tickets') }),
  'ov-assigned-tickets': createDataSpec('kpi', { widgetId: 'ov-assigned-tickets', formatting: 'count', apiMapping: createApiMapping('team_daily', 'assigned_tickets') }),
  'ov-first-response': createDataSpec('kpi', { widgetId: 'ov-first-response', formatting: 'duration_minutes', apiMapping: createApiMapping('team_daily', 'first_response_minutes') }),
  'ov-escalation-rate': createDataSpec('kpi', { widgetId: 'ov-escalation-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', ['escalation_rate', 'handoff_rate']) }),
  'ov-resolution-time': createDataSpec('kpi', { widgetId: 'ov-resolution-time', formatting: 'duration_hours', apiMapping: createApiMapping('team_daily', 'resolution_hours') }),
  'ov-pipeline-value': createDataSpec('kpi', { widgetId: 'ov-pipeline-value', formatting: 'currency', apiMapping: createApiMapping('team_daily', 'pipeline_value') }),
  'ov-win-rate': createDataSpec('kpi', { widgetId: 'ov-win-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', 'win_rate') }),
  'ov-avg-deal-size': createDataSpec('kpi', { widgetId: 'ov-avg-deal-size', formatting: 'currency', apiMapping: createApiMapping('team_daily', 'avg_deal_size') }),
  'ov-avg-sales-cycle': createDataSpec('kpi', { widgetId: 'ov-avg-sales-cycle', formatting: 'duration_days', apiMapping: createApiMapping('team_daily', 'sales_cycle_days') }),
  'ov-tickets-by-hour': createDataSpec('bar-chart', { widgetId: 'ov-tickets-by-hour', formatting: 'count', apiMapping: createApiMapping('hourly_daily', 'hourly_ticket_count', { dimension: 'hour', comparison: 'period_average' }) }),
  'ov-vc-missed-calls': createDataSpec('kpi', { widgetId: 'ov-vc-missed-calls', formatting: 'count', apiMapping: createApiMapping('team_daily', 'missed_calls') }),
  'ov-vc-total-calls': createDataSpec('kpi', { widgetId: 'ov-vc-total-calls', formatting: 'count', apiMapping: createApiMapping('team_daily', 'total_calls') }),
  'ov-intent-trends': createDataSpec('list', { widgetId: 'ov-intent-trends', formatting: 'count', exportShape: 'list', apiMapping: createApiMapping('intent_daily', 'intent_volume', { dimension: 'intent' }) }),
  'ov-knowledge-gaps': createDataSpec('kpi', { widgetId: 'ov-knowledge-gaps', formatting: 'count', apiMapping: createApiMapping('team_daily', 'knowledge_gap_count') }),
  'ov-exceptions': createDataSpec('list', { widgetId: 'ov-exceptions', exportShape: 'list', apiMapping: createApiMapping('team_daily', ['near_breach_tickets', 'low_confidence_ai_tickets', 'queue_overflow_tickets']) }),
  'ov-vc-calls-by-hour': createDataSpec('bar-chart', { widgetId: 'ov-vc-calls-by-hour', formatting: 'count', apiMapping: createApiMapping('hourly_daily', 'hourly_call_count', { dimension: 'hour', comparison: 'period_average' }) }),

  'un-tickets-created': createDataSpec('line-chart', { widgetId: 'un-tickets-created', formatting: 'count', apiMapping: createApiMapping('team_daily', 'tickets_created', { grain: 'date' }) }),
  'un-leads-created': createDataSpec('bar-chart', { widgetId: 'un-leads-created', formatting: 'count', apiMapping: createApiMapping('team_daily', 'leads_created', { grain: 'date', dimension: 'channel' }) }),
  'un-deals-created': createDataSpec('bar-chart', { widgetId: 'un-deals-created', formatting: 'count', apiMapping: createApiMapping('team_daily', 'deals_created', { grain: 'date', dimension: 'channel' }) }),
  'un-sales-funnel': createDataSpec('funnel', { widgetId: 'un-sales-funnel', formatting: 'count', exportShape: 'funnel', apiMapping: createApiMapping('stage_daily', 'stage_count', { dimension: 'stage' }) }),
  'un-deals-won-by-channel': createDataSpec('doughnut-chart', { widgetId: 'un-deals-won-by-channel', formatting: 'count', apiMapping: createApiMapping('lead_source_daily', ['lead_source_count', 'won_revenue'], { dimension: 'source' }) }),
  'un-deals-by-channel': createDataSpec('doughnut-chart', { widgetId: 'un-deals-by-channel', formatting: 'count', apiMapping: createApiMapping('lead_source_daily', 'lead_source_count', { dimension: 'source' }) }),
  'un-entry-channels': createDataSpec('bar-chart', { widgetId: 'un-entry-channels', formatting: 'count', apiMapping: createApiMapping('team_daily', ['tickets_created', 'new_contacts'], { dimension: 'channel' }) }),
  'un-vc-inbound-outbound': createDataSpec('bar-chart', { widgetId: 'un-vc-inbound-outbound', formatting: 'count', apiMapping: createApiMapping('voice_direction_daily', 'direction_calls', { dimension: 'direction', grain: 'date' }) }),
  'un-vc-duration-inbound-outbound': createDataSpec('bar-chart', { widgetId: 'un-vc-duration-inbound-outbound', formatting: 'duration_minutes', apiMapping: createApiMapping('call_quality_daily', ['avg_hold_minutes', 'hold_minutes'], { dimension: 'connection_result', grain: 'date' }) }),
  'un-new-returning': createDataSpec('doughnut-chart', { widgetId: 'un-new-returning', formatting: 'count', apiMapping: createApiMapping('contact_type_daily', 'contact_count', { dimension: 'contact_type' }) }),
  'un-intent-clusters': createDataSpec('bar-chart', { widgetId: 'un-intent-clusters', formatting: 'count', apiMapping: createApiMapping('intent_daily', 'intent_volume', { dimension: 'intent' }) }),
  'un-intent-trends': createDataSpec('line-chart', { widgetId: 'un-intent-trends', formatting: 'count', apiMapping: createApiMapping('intent_daily', 'intent_volume', { dimension: 'intent', grain: 'date' }) }),
  'un-emerging-intents': createDataSpec('list', { widgetId: 'un-emerging-intents', exportShape: 'list', apiMapping: createApiMapping('intent_daily', 'intent_volume', { dimension: 'intent' }) }),
  'un-unknown-intents': createDataSpec('kpi', { widgetId: 'un-unknown-intents', formatting: 'count', apiMapping: createApiMapping('team_daily', 'unknown_intents') }),
  'un-escalations-intent': createDataSpec('bar-chart', { widgetId: 'un-escalations-intent', formatting: 'count', apiMapping: createApiMapping('intent_daily', 'intent_escalations', { dimension: 'intent' }) }),
  'un-vc-channel-performance': createDataSpec('table', { widgetId: 'un-vc-channel-performance', exportShape: 'table', apiMapping: createApiMapping('voice_channel_daily', ['voice_channel_calls', 'voice_channel_wait'], { dimension: 'channel' }) }),

  'op-first-response': createDataSpec('kpi', { widgetId: 'op-first-response', formatting: 'duration_minutes', apiMapping: createApiMapping('team_daily', 'first_response_minutes') }),
  'op-vc-time-to-answer': createDataSpec('kpi', { widgetId: 'op-vc-time-to-answer', formatting: 'duration_minutes', apiMapping: createApiMapping('team_daily', 'avg_wait_minutes') }),
  'op-vc-call-duration-kpis': createDataSpec('kpi-group', { widgetId: 'op-vc-call-duration-kpis', formatting: 'duration_minutes', apiMapping: createApiMapping('team_daily', ['avg_call_duration_minutes', 'longest_wait_minutes']) }),
  'op-resolution-time': createDataSpec('kpi', { widgetId: 'op-resolution-time', formatting: 'duration_hours', apiMapping: createApiMapping('team_daily', 'resolution_hours') }),
  'op-created-closed': createDataSpec('line-chart', { widgetId: 'op-created-closed', formatting: 'count', apiMapping: createApiMapping('team_daily', ['tickets_created', 'tickets_resolved'], { grain: 'date' }) }),
  'op-reopened': createDataSpec('kpi', { widgetId: 'op-reopened', formatting: 'count', apiMapping: createApiMapping('team_daily', 'reopened_tickets') }),
  'op-workload-agent': createDataSpec('table', { widgetId: 'op-workload-agent', exportShape: 'table', apiMapping: createApiMapping('agent_daily', ['conversations_handled', 'agent_open_tickets', 'agent_csat'], { dimension: 'agent' }) }),
  'op-sales-performance': createDataSpec('table', { widgetId: 'op-sales-performance', exportShape: 'table', apiMapping: createApiMapping('agent_daily', ['leads_created', 'deals_created', 'pipeline_value', 'won_revenue', 'win_rate'], { dimension: 'agent' }) }),
  'op-channel-stage-matrix': createDataSpec('table', { widgetId: 'op-channel-stage-matrix', exportShape: 'table', apiMapping: createApiMapping('stage_daily', ['stage_count', 'stage_value'], { dimension: 'stage' }) }),
  'op-vc-calls-by-team': createDataSpec('bar-chart', { widgetId: 'op-vc-calls-by-team', formatting: 'count', apiMapping: createApiMapping('team_daily', ['inbound_calls', 'outbound_calls'], { dimension: 'team' }) }),
  'op-vc-avg-wait-by-team': createDataSpec('bar-chart', { widgetId: 'op-vc-avg-wait-by-team', formatting: 'duration_minutes', apiMapping: createApiMapping('team_daily', 'avg_wait_minutes', { dimension: 'team' }) }),
  'op-vc-longest-wait': createDataSpec('kpi', { widgetId: 'op-vc-longest-wait', formatting: 'duration_minutes', apiMapping: createApiMapping('team_daily', 'longest_wait_minutes') }),
  'op-vc-duration-by-team': createDataSpec('bar-chart', { widgetId: 'op-vc-duration-by-team', formatting: 'duration_minutes', apiMapping: createApiMapping('team_daily', 'avg_call_duration_minutes', { dimension: 'team' }) }),
  'op-sla-compliance': createDataSpec('progress', { widgetId: 'op-sla-compliance', formatting: 'rate', exportShape: 'metric', apiMapping: createApiMapping('team_daily', 'sla_breach_rate') }),
  'op-bottlenecks': createDataSpec('bar-chart', { widgetId: 'op-bottlenecks', formatting: 'count', apiMapping: createApiMapping('workflow_status_daily', 'status_count', { dimension: 'status' }) }),
  'op-channel-perf': createDataSpec('table', { widgetId: 'op-channel-perf', exportShape: 'table', apiMapping: createApiMapping('team_daily', ['resolution_hours', 'first_response_minutes', 'sla_breach_rate', 'tickets_resolved', 'open_tickets'], { dimension: 'channel' }) }),
  'op-capacity-demand': createDataSpec('line-chart', { widgetId: 'op-capacity-demand', formatting: 'duration_hours', apiMapping: createApiMapping('team_daily', ['capacity_hours', 'demand_hours'], { grain: 'date' }) }),
  'op-vc-abandonment-trend': createDataSpec('line-chart', { widgetId: 'op-vc-abandonment-trend', formatting: 'rate', apiMapping: createApiMapping('team_daily', ['abandonment_rate', 'total_calls'], { grain: 'date' }) }),
  'op-vc-callbacks-requested': createDataSpec('kpi', { widgetId: 'op-vc-callbacks-requested', formatting: 'count', apiMapping: createApiMapping('team_daily', 'callback_requests') }),
  'op-vc-agent-online-status': createDataSpec('agent-status', { widgetId: 'op-vc-agent-online-status', exportShape: 'list', apiMapping: createApiMapping('agent_presence_daily', ['online_hours', 'busy_hours', 'away_hours', 'offline_hours'], { dimension: 'agent' }) }),

  'im-csat': createDataSpec('kpi', { widgetId: 'im-csat', formatting: 'score', apiMapping: createApiMapping('team_daily', 'csat') }),
  'im-response-rate': createDataSpec('kpi', { widgetId: 'im-response-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', 'survey_response_rate') }),
  'im-vc-fcr-rate': createDataSpec('kpi', { widgetId: 'im-vc-fcr-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', 'first_call_resolution_rate') }),
  'im-vc-call-ticket-rate': createDataSpec('kpi', { widgetId: 'im-vc-call-ticket-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', 'call_to_ticket_rate') }),
  'im-responses': createDataSpec('kpi-group', { widgetId: 'im-responses', formatting: 'count', apiMapping: createApiMapping('team_daily', ['promoter_responses', 'detractor_responses', 'survey_responses']) }),
  'im-satisfaction-score': createDataSpec('line-chart', { widgetId: 'im-satisfaction-score', formatting: 'score', apiMapping: createApiMapping('team_daily', ['csat', 'survey_responses'], { grain: 'date' }) }),
  'im-surveys': createDataSpec('bar-chart', { widgetId: 'im-surveys', formatting: 'count', apiMapping: createApiMapping('team_daily', 'survey_responses', { grain: 'date' }) }),
  'im-reopen-rate': createDataSpec('kpi', { widgetId: 'im-reopen-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', 'reopen_rate') }),
  'im-knowledge-gaps': createDataSpec('bar-chart', { widgetId: 'im-knowledge-gaps', formatting: 'count', apiMapping: createApiMapping('intent_daily', 'intent_knowledge_gaps', { dimension: 'intent' }) }),
  'im-suggested-knowledge': createDataSpec('list-actions', { widgetId: 'im-suggested-knowledge', exportShape: 'list', apiMapping: createApiMapping('knowledge_article_daily', ['article_fallback_tickets', 'article_views', 'ai_article_citations']) }),
  'im-opportunities': createDataSpec('opportunities', { widgetId: 'im-opportunities', exportShape: 'list', apiMapping: createApiMapping('team_daily', ['opportunity_count', 'knowledge_gap_count', 'handoff_rate']) }),

  'au-ai-tickets': createDataSpec('kpi', { widgetId: 'au-ai-tickets', formatting: 'count', apiMapping: createApiMapping('team_daily', 'ai_tickets') }),
  'au-resolution-rate': createDataSpec('kpi', { widgetId: 'au-resolution-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', 'ai_resolution_rate') }),
  'au-assistance-rate': createDataSpec('kpi', { widgetId: 'au-assistance-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', 'ai_assist_rate') }),
  'au-open-ticket-rate': createDataSpec('kpi', { widgetId: 'au-open-ticket-rate', formatting: 'rate', apiMapping: createApiMapping('team_daily', 'ai_open_ticket_rate') }),
  'au-vc-ivr-queue-time': createDataSpec('kpi', { widgetId: 'au-vc-ivr-queue-time', formatting: 'duration_minutes', apiMapping: createApiMapping('team_daily', 'ivr_queue_minutes') }),
  'au-journeys-success': createDataSpec('progress', { widgetId: 'au-journeys-success', formatting: 'rate', exportShape: 'metric', apiMapping: createApiMapping('team_daily', 'automation_success_rate') }),
  'au-journeys-escalations': createDataSpec('kpi', { widgetId: 'au-journeys-escalations', formatting: 'count', apiMapping: createApiMapping('team_daily', 'journeys_escalations') }),
  'au-handoff-reasons': createDataSpec('bar-chart', { widgetId: 'au-handoff-reasons', formatting: 'count', apiMapping: createApiMapping('handoff_reason_daily', 'handoff_reason_count', { dimension: 'reason' }) }),
  'au-conflicts': createDataSpec('list', { widgetId: 'au-conflicts', exportShape: 'list', apiMapping: createApiMapping('team_daily', 'automation_conflicts') }),
  'au-safety': createDataSpec('list', { widgetId: 'au-safety', exportShape: 'list', apiMapping: createApiMapping('team_daily', 'guardrail_violations') }),
};

const WIDGET_FUTURE_SPECS = {
  'ov-exceptions': { stage: 'future' },
  'un-emerging-intents': { stage: 'future' },
  'op-capacity-demand': { stage: 'future' },
  'im-suggested-knowledge': { stage: 'future' },
  'im-opportunities': { stage: 'future' },
  'au-conflicts': { stage: 'future' },
  'au-safety': { stage: 'future' },
  'ov-escalation-rate': { stage: 'mixed' },
  'ov-knowledge-gaps': { stage: 'mixed' },
  'un-unknown-intents': { stage: 'mixed' },
  'im-knowledge-gaps': { stage: 'mixed' },
  'au-journeys-success': { stage: 'mixed' },
  'au-journeys-escalations': { stage: 'mixed' },
  'au-handoff-reasons': { stage: 'mixed' },
  'op-vc-agent-online-status': { stage: 'mixed' },
};

function buildWidgetDataSpec(widget) {
  if (!DATA_WIDGET_TYPES.has(widget.type)) return null;
  const explicit = WIDGET_DATA_SPECS[widget.id];
  if (explicit) return explicit;
  return createDataSpec(widget.type, { widgetId: widget.id });
}

function buildWidgetFutureSpec(widget) {
  if (!DATA_WIDGET_TYPES.has(widget.type)) return null;
  const explicit = WIDGET_FUTURE_SPECS[widget.id] || {};
  return {
    stage: explicit.stage || 'v1',
    inlineTargets: (explicit.inlineTargets || defaultInlineTargetsForType(widget.type)).slice(),
  };
}

Object.keys(WIDGETS).forEach((categoryId) => {
  WIDGETS[categoryId] = WIDGETS[categoryId].map((widget) => {
    const dataSpec = buildWidgetDataSpec(widget);
    const futureSpec = buildWidgetFutureSpec(widget);
    return {
      ...widget,
      ...(dataSpec ? { dataSpec } : {}),
      ...(futureSpec ? { futureSpec } : {}),
    };
  });
});

// Flat lookup: widget ID → widget definition (with _sourceCategory attached)
const WIDGET_BY_ID = {};
Object.keys(WIDGETS).forEach(cat => {
  WIDGETS[cat].forEach(w => {
    WIDGET_BY_ID[w.id] = { ...w, _sourceCategory: cat };
  });
});

// Set of all valid widget IDs (used by dashboard-config.js for validation)
const ALL_WIDGET_IDS = new Set(Object.keys(WIDGET_BY_ID));

// Tag → widget IDs index for fast tag-based lookups
const WIDGET_TAGS = {};
Object.values(WIDGETS).flat().forEach(w => {
  if (w.tags) w.tags.forEach(tag => {
    if (!WIDGET_TAGS[tag]) WIDGET_TAGS[tag] = [];
    WIDGET_TAGS[tag].push(w.id);
  });
});
