import { handleAnalyticsQuery } from './analytics-query.js';
import { analyzeCorrectionInsight, organizeFeedback, rebuildTrackSummary, typeToTrack } from './feedback-organizer.js';

const SEED_EMAIL = 'rmilwid@gmail.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// Map D1 feedback row to frontend-compatible camelCase
function mapSubmissionRow(row) {
  return {
    id: row.id,
    text: row.raw_text,
    section: row.section,
    type: row.type,
    submitterName: row.submitter_name,
    createdAt: row.submitted_at,
    organizeStatus: row.organize_status,
    rawEventJson: parseJsonColumn(row.raw_event_json),
    insightJson: parseJsonColumn(row.insight_json),
    deleted: !!row.deleted,
    deletedAt: row.deleted_at,
  };
}

function parseJsonColumn(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function stringifyJsonColumn(value) {
  return value == null ? null : JSON.stringify(value);
}

async function readJsonBody(request) {
  const text = await request.text();
  return text ? JSON.parse(text) : {};
}

// ── Valid widget IDs (synced from widget-catalog.js) ─────────
const VALID_WIDGET_IDS = new Set([
  'ov-open-tickets', 'ov-assigned-tickets', 'ov-first-response', 'ov-escalation-rate',
  'ov-resolution-time', 'ov-pipeline-value', 'ov-win-rate', 'ov-avg-deal-size',
  'ov-avg-sales-cycle', 'ov-tickets-by-hour', 'ov-vc-missed-calls', 'ov-vc-total-calls',
  'ov-intent-trends', 'ov-knowledge-gaps', 'ov-exceptions', 'ov-vc-calls-by-hour',
  'un-tickets-created', 'un-leads-created', 'un-deals-created', 'un-sales-funnel',
  'un-deals-won-by-channel', 'un-deals-by-channel', 'un-entry-channels',
  'un-vc-inbound-outbound', 'un-vc-duration-inbound-outbound', 'un-new-returning',
  'un-intent-clusters', 'un-intent-trends', 'un-emerging-intents', 'un-unknown-intents',
  'un-escalations-intent', 'un-vc-channel-performance',
  'op-first-response', 'op-vc-time-to-answer', 'op-vc-call-duration-kpis',
  'op-resolution-time', 'op-created-closed', 'op-reopened', 'op-workload-agent',
  'op-sales-performance', 'op-channel-stage-matrix', 'op-vc-calls-by-team',
  'op-vc-avg-wait-by-team', 'op-vc-longest-wait', 'op-vc-duration-by-team',
  'op-sla-compliance', 'op-bottlenecks', 'op-channel-perf', 'op-capacity-demand',
  'op-vc-abandonment-trend', 'op-vc-callbacks-requested', 'op-vc-agent-online-status',
  'im-csat', 'im-response-rate', 'im-vc-fcr-rate', 'im-vc-call-ticket-rate',
  'im-responses', 'im-satisfaction-score', 'im-surveys', 'im-reopen-rate',
  'im-knowledge-gaps', 'im-suggested-knowledge', 'im-opportunities',
  'au-ai-tickets', 'au-resolution-rate', 'au-assistance-rate', 'au-open-ticket-rate',
  'au-vc-ivr-queue-time', 'au-journeys-success', 'au-journeys-escalations',
  'au-handoff-reasons', 'au-conflicts', 'au-safety',
]);

// ── Config validation ────────────────────────────────────────
function validateConfig(config) {
  const errors = [];

  if (typeof config.version !== 'number') errors.push('missing or invalid "version"');

  // Tabs
  if (!Array.isArray(config.tabs) || config.tabs.length === 0) {
    errors.push('"tabs" must be a non-empty array');
  } else {
    const tabIds = new Set();
    config.tabs.forEach((t, i) => {
      if (!t.id || typeof t.id !== 'string') errors.push(`tabs[${i}]: missing "id"`);
      if (!t.label || typeof t.label !== 'string') errors.push(`tabs[${i}]: missing "label"`);
      if (t.id) tabIds.add(t.id);
    });

    // tabWidgets keys must reference existing tabs
    if (config.tabWidgets && typeof config.tabWidgets === 'object') {
      for (const tabId of Object.keys(config.tabWidgets)) {
        if (!tabIds.has(tabId)) errors.push(`tabWidgets["${tabId}"]: no matching tab`);
        const widgets = config.tabWidgets[tabId];
        if (Array.isArray(widgets)) {
          for (const wid of widgets) {
            // Allow custom tab IDs (custom-*) but validate widget IDs
            if (!VALID_WIDGET_IDS.has(wid)) errors.push(`tabWidgets["${tabId}"]: unknown widget "${wid}"`);
          }
        }
      }
    }

    // sectionOrder keys must reference existing tabs
    if (config.sectionOrder && typeof config.sectionOrder === 'object') {
      for (const secId of Object.keys(config.sectionOrder)) {
        if (!tabIds.has(secId)) errors.push(`sectionOrder["${secId}"]: no matching tab`);
        const order = config.sectionOrder[secId];
        if (Array.isArray(order)) {
          for (const wid of order) {
            if (!VALID_WIDGET_IDS.has(wid)) errors.push(`sectionOrder["${secId}"]: unknown widget "${wid}"`);
          }
        }
      }
    }
  }

  // Lens and role
  if (config.lens && !['support', 'sales'].includes(config.lens)) {
    errors.push(`"lens" must be "support" or "sales", got "${config.lens}"`);
  }
  if (config.role && !['supervisor', 'agent'].includes(config.role)) {
    errors.push(`"role" must be "supervisor" or "agent", got "${config.role}"`);
  }

  return errors;
}

// ── ProtoGuide: verify admin from Bearer token ───────────────
async function verifyProtoGuideAdmin(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const idToken = auth.slice(7);

  try {
    const verifyResp = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
    if (!verifyResp.ok) return null;
    const tokenData = await verifyResp.json();

    const users = await env.PROTOGUIDE_AUTH.get('users', 'json') || {};
    const userEntry = users[tokenData.email];
    if (!userEntry || userEntry.role !== 'admin') return null;

    return { email: tokenData.email, role: userEntry.role };
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname;

    // ══════════════════════════════════════════════════════════
    // ProtoGuide Auth & Admin endpoints
    // ══════════════════════════════════════════════════════════

    // ── POST /protoguide/auth/check ──────────────────────────
    if (path === '/protoguide/auth/check' && request.method === 'POST') {
      try {
        const { email, idToken } = await request.json();
        if (!email || !idToken) return json({ error: 'missing email or idToken' }, 400);

        // Verify Google ID token
        const verifyResp = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
        if (!verifyResp.ok) return json({ error: 'Invalid token' }, 403);
        const tokenData = await verifyResp.json();

        if (tokenData.email !== email) return json({ error: 'Token email mismatch' }, 403);

        const users = await env.PROTOGUIDE_AUTH.get('users', 'json') || {};
        const domains = await env.PROTOGUIDE_AUTH.get('domains', 'json') || [];

        // Bootstrap: if no users and no domains, auto-create as admin
        if (Object.keys(users).length === 0 && domains.length === 0) {
          users[email] = { role: 'admin', createdAt: new Date().toISOString() };
          await env.PROTOGUIDE_AUTH.put('users', JSON.stringify(users));
          return json({ role: 'admin', email });
        }

        // Check if user exists
        if (users[email]) {
          return json({ role: users[email].role, email });
        }

        // Check if email domain is allowed (case-insensitive)
        const emailDomain = (email.split('@')[1] || '').toLowerCase();
        if (domains.map(d => d.toLowerCase()).includes(emailDomain)) {
          // Auto-add as viewer
          users[email] = { role: 'viewer', createdAt: new Date().toISOString() };
          await env.PROTOGUIDE_AUTH.put('users', JSON.stringify(users));
          return json({ role: 'viewer', email });
        }

        return json({ error: 'Access denied' }, 403);
      } catch (e) {
        return json({ error: 'auth check failed', message: e.message }, 500);
      }
    }

    // ── GET /protoguide/users ────────────────────────────────
    if (path === '/protoguide/users' && request.method === 'GET') {
      const admin = await verifyProtoGuideAdmin(request, env);
      if (!admin) return json({ error: 'Unauthorized' }, 401);

      const users = await env.PROTOGUIDE_AUTH.get('users', 'json') || {};
      const userList = Object.entries(users).map(([email, data]) => ({
        email,
        role: data.role,
        createdAt: data.createdAt,
      }));
      return json({ users: userList });
    }

    // ── POST /protoguide/users ───────────────────────────────
    if (path === '/protoguide/users' && request.method === 'POST') {
      const admin = await verifyProtoGuideAdmin(request, env);
      if (!admin) return json({ error: 'Unauthorized' }, 401);

      const { email, role } = await request.json();
      if (!email || !['admin', 'viewer'].includes(role)) {
        return json({ error: 'Invalid email or role' }, 400);
      }

      if (email.toLowerCase() === SEED_EMAIL && role !== 'admin') {
        return json({ error: 'Cannot change role of seed admin' }, 403);
      }

      const users = await env.PROTOGUIDE_AUTH.get('users', 'json') || {};
      users[email] = { role, createdAt: users[email]?.createdAt || new Date().toISOString() };
      await env.PROTOGUIDE_AUTH.put('users', JSON.stringify(users));
      return json({ ok: true });
    }

    // ── DELETE /protoguide/users/:email ──────────────────────
    if (path.startsWith('/protoguide/users/') && request.method === 'DELETE') {
      const admin = await verifyProtoGuideAdmin(request, env);
      if (!admin) return json({ error: 'Unauthorized' }, 401);

      const emailParam = decodeURIComponent(path.split('/protoguide/users/')[1]);
      if (!emailParam) return json({ error: 'missing email' }, 400);

      if (emailParam.toLowerCase() === SEED_EMAIL) {
        return json({ error: 'Cannot delete seed admin' }, 403);
      }

      const users = await env.PROTOGUIDE_AUTH.get('users', 'json') || {};
      delete users[emailParam];
      await env.PROTOGUIDE_AUTH.put('users', JSON.stringify(users));
      return json({ ok: true });
    }

    // ── GET /protoguide/domains ──────────────────────────────
    if (path === '/protoguide/domains' && request.method === 'GET') {
      const admin = await verifyProtoGuideAdmin(request, env);
      if (!admin) return json({ error: 'Unauthorized' }, 401);

      const domains = await env.PROTOGUIDE_AUTH.get('domains', 'json') || [];
      return json({ domains });
    }

    // ── POST /protoguide/domains ─────────────────────────────
    if (path === '/protoguide/domains' && request.method === 'POST') {
      const admin = await verifyProtoGuideAdmin(request, env);
      if (!admin) return json({ error: 'Unauthorized' }, 401);

      const { domain } = await request.json();
      if (!domain) return json({ error: 'missing domain' }, 400);

      const domains = await env.PROTOGUIDE_AUTH.get('domains', 'json') || [];
      if (!domains.includes(domain)) {
        domains.push(domain);
        await env.PROTOGUIDE_AUTH.put('domains', JSON.stringify(domains));
      }
      return json({ ok: true });
    }

    // ── DELETE /protoguide/domains/:domain ───────────────────
    if (path.startsWith('/protoguide/domains/') && request.method === 'DELETE') {
      const admin = await verifyProtoGuideAdmin(request, env);
      if (!admin) return json({ error: 'Unauthorized' }, 401);

      const domainParam = decodeURIComponent(path.split('/protoguide/domains/')[1]);
      if (!domainParam) return json({ error: 'missing domain' }, 400);

      let domains = await env.PROTOGUIDE_AUTH.get('domains', 'json') || [];
      domains = domains.filter(d => d !== domainParam);
      await env.PROTOGUIDE_AUTH.put('domains', JSON.stringify(domains));
      return json({ ok: true });
    }

    // ══════════════════════════════════════════════════════════
    // Existing endpoints
    // ══════════════════════════════════════════════════════════

    // ── GET /config/:userId — read user dashboard config ─────
    if (path.startsWith('/config/') && request.method === 'GET') {
      const userId = decodeURIComponent(path.split('/config/')[1]);
      if (!userId) return json({ error: 'missing userId' }, 400);
      try {
        const config = await env.DASHBOARD_CONFIG.get(userId, 'json');
        if (!config) return json({ error: 'not found' }, 404);
        return new Response(JSON.stringify(config), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
        });
      } catch (e) {
        return json({ error: 'kv error' }, 500);
      }
    }

    // ── PUT /config/:userId — write user dashboard config ────
    if (path.startsWith('/config/') && request.method === 'PUT') {
      const userId = decodeURIComponent(path.split('/config/')[1]);
      if (!userId) return json({ error: 'missing userId' }, 400);
      try {
        const incoming = await request.json();
        const { baseRevision, ...config } = incoming;

        // Validate config shape
        const errors = validateConfig(config);
        if (errors.length > 0) {
          return json({ error: 'validation failed', details: errors }, 400);
        }

        // Optimistic concurrency check
        const existing = await env.DASHBOARD_CONFIG.get(userId, 'json');
        if (existing) {
          const currentRevision = existing.revision || 0;
          if (typeof baseRevision === 'number' && baseRevision !== currentRevision) {
            return json({ error: 'conflict', config: existing }, 409);
          }
          config.revision = currentRevision + 1;
        } else {
          // First write for this user
          config.revision = 1;
        }

        config.updatedAt = new Date().toISOString();
        await env.DASHBOARD_CONFIG.put(userId, JSON.stringify(config));
        return json({ ok: true, revision: config.revision });
      } catch (e) {
        return json({ error: 'kv error', message: e.message }, 500);
      }
    }

    // ── POST /onboarding/chat — AI proxy with Anthropic → OpenAI fallback ────
    if (path === '/onboarding/chat' && request.method === 'POST') {
      try {
        const { system, messages, tools } = await request.json();

        // --- Provider 1: Anthropic (Claude Sonnet) ---
        if (env.ANTHROPIC_API_KEY) {
          const anthropicBody = {
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system,
            messages,
          };
          if (tools && tools.length > 0) anthropicBody.tools = tools;
          const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(anthropicBody),
          });
          const anthropicData = await anthropicResp.json();
          // Only fall through on billing/auth errors, not on successful responses (even with stop_reason)
          if (anthropicResp.ok) return json({ ...anthropicData, provider: 'anthropic' });
          const errType = anthropicData?.error?.type || '';
          const errMsg = anthropicData?.error?.message || '';
          const isBillingOrAuth = errType === 'authentication_error' ||
            errMsg.toLowerCase().includes('credit') ||
            errMsg.toLowerCase().includes('billing') ||
            anthropicResp.status === 401 || anthropicResp.status === 403;
          if (!isBillingOrAuth) return json(anthropicData, anthropicResp.status);
          // Billing/auth error → fall through to OpenAI
        }

        // --- Provider 2: OpenAI (GPT-4.1) ---
        if (env.OPENAI_API_KEY) {
          // Convert Anthropic message format to OpenAI format
          const openaiMessages = [];
          if (system) openaiMessages.push({ role: 'system', content: system });
          for (const msg of messages) {
            if (typeof msg.content === 'string') {
              openaiMessages.push({ role: msg.role, content: msg.content });
            } else if (Array.isArray(msg.content)) {
              // Handle tool_result blocks and text blocks
              const parts = [];
              const toolResults = [];
              for (const block of msg.content) {
                if (block.type === 'text') parts.push(block.text);
                else if (block.type === 'tool_use') {
                  // Assistant tool call — handled separately
                  openaiMessages.push({ role: 'assistant', content: parts.length ? parts.join('\n') : null,
                    tool_calls: [{ id: block.id, type: 'function', function: { name: block.name, arguments: JSON.stringify(block.input) } }] });
                  parts.length = 0;
                  continue;
                } else if (block.type === 'tool_result') {
                  toolResults.push({ role: 'tool', tool_call_id: block.tool_use_id, content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content) });
                }
              }
              if (parts.length > 0) openaiMessages.push({ role: msg.role, content: parts.join('\n') });
              toolResults.forEach(tr => openaiMessages.push(tr));
            }
          }

          // Convert Anthropic tools to OpenAI function format
          let openaiTools;
          if (tools && tools.length > 0) {
            openaiTools = tools.map(t => ({
              type: 'function',
              function: { name: t.name, description: t.description, parameters: t.input_schema },
            }));
          }

          // Detect first turn (only the seed message, no prior assistant turns)
          const isFirstTurn = messages.length === 1 && messages[0].role === 'user';

          const openaiBody = { model: 'gpt-4.1', messages: openaiMessages, max_tokens: 4096 };
          if (openaiTools) {
            openaiBody.tools = openaiTools;
            // Encourage tool use on the first turn so interactive components appear.
            if (isFirstTurn) openaiBody.tool_choice = 'required';
          }

          const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
            body: JSON.stringify(openaiBody),
          });
          const openaiData = await openaiResp.json();

          if (openaiResp.ok) {
            // Normalise OpenAI response → Anthropic format for frontend compatibility
            const choice = openaiData.choices?.[0];
            const contentBlocks = [];
            if (choice?.message?.content) contentBlocks.push({ type: 'text', text: choice.message.content });
            if (choice?.message?.tool_calls) {
              for (const tc of choice.message.tool_calls) {
                contentBlocks.push({
                  type: 'tool_use', id: tc.id, name: tc.function.name,
                  input: JSON.parse(tc.function.arguments || '{}'),
                });
              }
            }
            return json({
              id: openaiData.id, type: 'message', role: 'assistant', content: contentBlocks,
              stop_reason: choice?.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn',
              model: openaiData.model, provider: 'openai',
            });
          }
          const openaiErr = openaiData?.error?.code || openaiData?.error?.type || '';
          const isOpenAIBilling = openaiErr === 'insufficient_quota' || openaiResp.status === 401 || openaiResp.status === 429;
          if (!isOpenAIBilling) return json({ error: openaiData?.error?.message || 'OpenAI error' }, openaiResp.status);
          // Fall through to Gemini
        }

        return json({ error: 'No AI provider available — check API keys' }, 503);
      } catch (e) {
        return json({ error: 'proxy error', message: e.message }, 500);
      }
    }

    // ── GET /profile/:userId — read customer profile ─────────
    if (path.startsWith('/profile/') && request.method === 'GET') {
      const userId = decodeURIComponent(path.split('/profile/')[1]);
      if (!userId) return json({ error: 'missing userId' }, 400);
      try {
        const profile = await env.CUSTOMER_PROFILES.get(userId, 'json');
        if (!profile) return json({ error: 'not found' }, 404);
        return new Response(JSON.stringify(profile), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
        });
      } catch (e) {
        return json({ error: 'kv error' }, 500);
      }
    }

    // ── PUT /profile/:userId — write customer profile ────────
    if (path.startsWith('/profile/') && request.method === 'PUT') {
      const userId = decodeURIComponent(path.split('/profile/')[1]);
      if (!userId) return json({ error: 'missing userId' }, 400);
      try {
        const profile = await request.json();
        profile.updatedAt = new Date().toISOString();
        if (!profile.createdAt) profile.createdAt = profile.updatedAt;
        await env.CUSTOMER_PROFILES.put(userId, JSON.stringify(profile));
        return json({ ok: true });
      } catch (e) {
        return json({ error: 'kv error', message: e.message }, 500);
      }
    }

    // ── POST /extract-url — fetch URL and extract text ───────
    if (path === '/extract-url' && request.method === 'POST') {
      try {
        const { url: targetUrl } = await request.json();
        if (!targetUrl) return json({ error: 'missing url' }, 400);

        const fetchWithProfile = async (fetchUrl) => fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          redirect: 'follow',
        });

        let response = await fetchWithProfile(targetUrl);
        if (!response.ok) {
          const normalized = (() => {
            try {
              const parsed = new URL(targetUrl);
              return parsed.origin + '/';
            } catch {
              return null;
            }
          })();
          if (normalized && normalized !== targetUrl) {
            response = await fetchWithProfile(normalized);
          }
        }
        if (!response.ok) {
          return json({ error: 'fetch failed', status: response.status }, 502);
        }

        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Strip HTML to plain text
        let text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')  // remove scripts
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')    // remove styles
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')        // remove nav
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')  // remove header
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')  // remove footer
          .replace(/<[^>]+>/g, ' ')                           // strip remaining tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#?\w+;/g, ' ')                           // remaining entities
          .replace(/\s+/g, ' ')                               // collapse whitespace
          .trim();

        // Truncate to ~50k chars
        if (text.length > 50000) text = text.substring(0, 50000) + '... [truncated]';

        return json({ text, title, url: targetUrl });
      } catch (e) {
        return json({ error: 'extraction failed', message: e.message }, 500);
      }
    }

    // ── POST /analytics/query — semantic analytics query ────
    if (path === '/analytics/query' && request.method === 'POST') {
      try {
        const body = await request.json();
        const result = await handleAnalyticsQuery(body);
        const status = result?.error ? 400 : 200;
        return json(result, status);
      } catch (e) {
        return json({ error: 'analytics query failed', message: e.message }, 500);
      }
    }

    // ── GET /protoguide/feedback/summary — organized summaries ──
    if (path === '/protoguide/feedback/summary' && request.method === 'GET') {
      try {
        const { results } = await env.FEEDBACK_DB.prepare(
          'SELECT track, summary_json FROM feedback_summaries'
        ).all();
        const summaries = {};
        for (const row of results) {
          try { summaries[row.track] = JSON.parse(row.summary_json); } catch (_) {}
        }
        return json({ summaries });
      } catch (e) {
        return json({ error: 'Failed to fetch summaries', message: e.message }, 500);
      }
    }

    // ── POST /protoguide/feedback/summary — rebuild track ───────
    if (path === '/protoguide/feedback/summary' && request.method === 'POST') {
      try {
        const action = url.searchParams.get('action');
        const track = url.searchParams.get('track');
        if (action === 'rebuild' && track) {
          const result = await rebuildTrackSummary(env.FEEDBACK_DB, env, track);
          return json(result);
        }
        return json({ error: 'Missing action=rebuild&track=...' }, 400);
      } catch (e) {
        return json({ error: 'Rebuild failed', message: e.message }, 500);
      }
    }

    // ── GET /protoguide/feedback — list all feedback (D1) ─────────
    if (path === '/protoguide/feedback' && request.method === 'GET') {
      try {
        const { results } = await env.FEEDBACK_DB.prepare(
          'SELECT * FROM feedback_submissions WHERE deleted = 0 ORDER BY submitted_at DESC'
        ).all();

        // Auto-migrate from KV if D1 is empty
        if (results.length === 0) {
          const kvData = await env.PROTOGUIDE_AUTH.get('feedback', 'json');
          if (kvData && kvData.length > 0) {
            for (const item of kvData) {
              await env.FEEDBACK_DB.prepare(
                'INSERT OR IGNORE INTO feedback_submissions (id, submitted_at, submitter_name, raw_text, section, type, deleted, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
              ).bind(
                item.id,
                item.createdAt || new Date().toISOString(),
                item.submitterName || item.submitter_name || null,
                item.text || item.rawText || item.raw_text || '',
                item.section || 'General',
                item.type || 'product',
                item.deleted ? 1 : 0,
                item.deletedAt || item.deleted_at || null
              ).run();
            }
            await env.PROTOGUIDE_AUTH.delete('feedback');
            // Re-query after migration
            const { results: migrated } = await env.FEEDBACK_DB.prepare(
              'SELECT * FROM feedback_submissions WHERE deleted = 0 ORDER BY submitted_at DESC'
            ).all();
            return json({ submissions: migrated.map(mapSubmissionRow) });
          }
        }

        return json({ submissions: results.map(mapSubmissionRow) });
      } catch (e) {
        return json({ error: 'Failed to fetch feedback', message: e.message }, 500);
      }
    }

    // ── POST /protoguide/feedback — store feedback entry (D1) ──────
    if (path === '/protoguide/feedback' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request);
        const id = 'fb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const text = body.text || '';
        const section = body.section || 'General';
        const type = body.type || 'product';
        const submitterName = body.submitterName || body.submitter_name || null;
        const rawEventJson = body.rawEvent || body.raw_event_json || null;
        const deferUntilQualified = Boolean(body.deferUntilQualified);

        if (type === 'correction' && rawEventJson && deferUntilQualified) {
          const insight = await analyzeCorrectionInsight(env, rawEventJson, { candidate: true });
          if (!insight.shouldStore) {
            return json({ ok: true, skipped: true });
          }

          const insightPayload = {
            issue: insight.issue,
            context: insight.context,
            possibleCorrection: insight.possibleCorrection,
          };
          const storedText = text || insight.issue.summary || 'AI issue logged';

          await env.FEEDBACK_DB.prepare(
            'INSERT INTO feedback_submissions (id, submitter_name, raw_text, section, type, raw_event_json, insight_json) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            id,
            submitterName,
            storedText,
            section,
            type,
            stringifyJsonColumn(rawEventJson),
            stringifyJsonColumn(insightPayload)
          ).run();

          const track = typeToTrack(type);
          ctx.waitUntil(
            organizeFeedback(env.FEEDBACK_DB, env, track, {
              id,
              rawText: storedText,
              section,
              type,
              rawEventJson,
              insightJson: insightPayload,
            }).catch(e => console.error('Organizer error:', e.message))
          );

          return json({ ok: true, id });
        }

        await env.FEEDBACK_DB.prepare(
          'INSERT INTO feedback_submissions (id, submitter_name, raw_text, section, type, raw_event_json) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, submitterName, text, section, type, stringifyJsonColumn(rawEventJson)).run();

        // Fire-and-forget organizer
        const track = typeToTrack(type);
        ctx.waitUntil(
          (async () => {
            let insightPayload = null;
            if (type === 'correction' && rawEventJson) {
              try {
                const insight = await analyzeCorrectionInsight(env, rawEventJson);
                insightPayload = {
                  issue: insight.issue,
                  context: insight.context,
                  possibleCorrection: insight.possibleCorrection,
                };
                await env.FEEDBACK_DB.prepare(
                  'UPDATE feedback_submissions SET insight_json = ? WHERE id = ?'
                ).bind(stringifyJsonColumn(insightPayload), id).run();
              } catch (e) {
                console.error('Correction analyzer error:', e.message);
              }
            }

            await organizeFeedback(env.FEEDBACK_DB, env, track, {
              id,
              rawText: text,
              section,
              type,
              rawEventJson,
              insightJson: insightPayload,
            });
          })().catch(e => console.error('Organizer error:', e.message))
        );

        return json({ ok: true, id });
      } catch (e) {
        return json({ error: 'Failed to store feedback', message: e.message }, 500);
      }
    }

    // ── PUT /protoguide/feedback/:id — update feedback entry (D1) ──
    if (path.startsWith('/protoguide/feedback/') && request.method === 'PUT') {
      try {
        const feedbackId = decodeURIComponent(path.split('/protoguide/feedback/')[1]);
        const body = await request.json();
        const sets = [];
        const vals = [];
        if (body.text !== undefined) { sets.push('raw_text = ?'); vals.push(body.text); }
        if (body.section !== undefined) { sets.push('section = ?'); vals.push(body.section); }
        if (body.type !== undefined) { sets.push('type = ?'); vals.push(body.type); }
        if (body.submitterName !== undefined) { sets.push('submitter_name = ?'); vals.push(body.submitterName); }
        if (body.rawEventJson !== undefined || body.raw_event_json !== undefined) {
          sets.push('raw_event_json = ?');
          vals.push(stringifyJsonColumn(body.rawEventJson !== undefined ? body.rawEventJson : body.raw_event_json));
        }
        if (body.insightJson !== undefined || body.insight_json !== undefined) {
          sets.push('insight_json = ?');
          vals.push(stringifyJsonColumn(body.insightJson !== undefined ? body.insightJson : body.insight_json));
        }
        if (sets.length === 0) return json({ ok: true });
        vals.push(feedbackId);
        await env.FEEDBACK_DB.prepare(
          `UPDATE feedback_submissions SET ${sets.join(', ')} WHERE id = ?`
        ).bind(...vals).run();
        return json({ ok: true });
      } catch (e) {
        return json({ error: 'Failed to update feedback', message: e.message }, 500);
      }
    }

    // ── DELETE /protoguide/feedback/:id — soft-delete (D1) ────────
    if (path.startsWith('/protoguide/feedback/') && request.method === 'DELETE') {
      try {
        const feedbackId = decodeURIComponent(path.split('/protoguide/feedback/')[1]);
        const result = await env.FEEDBACK_DB.prepare(
          "UPDATE feedback_submissions SET deleted = 1, deleted_at = datetime('now') WHERE id = ?"
        ).bind(feedbackId).run();
        if (result.meta.changes === 0) return json({ error: 'not found' }, 404);
        return json({ ok: true });
      } catch (e) {
        return json({ error: 'Failed to delete feedback', message: e.message }, 500);
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
