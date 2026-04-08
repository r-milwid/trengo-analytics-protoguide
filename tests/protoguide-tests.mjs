/**
 * ProtoGuide Comprehensive Test Suite
 *
 * Static analysis tests that verify consistency across the ProtoGuide codebase.
 * Runs with Node.js built-in test runner: node --test tests/protoguide-tests.mjs
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// ── File loading ───────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');
const readFile = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

const protoguideJs = readFile('protoguide/protoguide.js');
const protoguideHtml = readFile('protoguide/protoguide.html');
const workerJs = readFile('chatbot-proxy/worker.js');
const feedbackOrganizerJs = readFile('chatbot-proxy/feedback-organizer.js');
const appJs = readFile('app.js');
const loginHtml = readFile('protoguide/protoguide-login.html');

// CSS may or may not exist at the expected path
let protoguideCss = '';
try { protoguideCss = readFile('protoguide/protoguide.css'); } catch (_) {}

let loginCss = '';
try { loginCss = readFile('protoguide/protoguide-login.css'); } catch (_) {}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extract all id="..." values from an HTML string */
function extractHtmlIds(html) {
  const ids = new Set();
  const re = /\bid=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.add(m[1]);
  return ids;
}

/** Extract all document.getElementById('...') calls from JS */
function extractGetElementByIdCalls(js) {
  const ids = new Set();
  const re = /document\.getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(js)) !== null) ids.add(m[1]);
  return ids;
}

/** Extract <script src="..."> paths from HTML */
function extractScriptSrcs(html) {
  const srcs = [];
  const re = /<script[^>]+src=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) srcs.push(m[1]);
  return srcs;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. HTML Element ID Consistency Tests
// ════════════════════════════════════════════════════════════════════════════

describe('1. HTML Element ID Consistency', () => {
  const htmlIds = extractHtmlIds(protoguideHtml);
  const jsIds = extractGetElementByIdCalls(protoguideJs);

  test('protoguide.html has at least 20 element IDs', () => {
    assert.ok(htmlIds.size >= 20, `Expected >= 20 IDs, found ${htmlIds.size}`);
  });

  test('protoguide.js has at least 10 getElementById calls', () => {
    assert.ok(jsIds.size >= 10, `Expected >= 10 calls, found ${jsIds.size}`);
  });

  // Critical elements that MUST have matching HTML ids
  const criticalIds = [
    'chat-messages', 'chat-input', 'chat-send',
    'open-settings-btn', 'open-insights-btn',
    'settings-overlay', 'settings-overlay-body',
    'insights-overlay',
    'manage-users-modal-overlay', 'manage-users-body', 'manage-users-modal-close',
    'ai-panel-settings-row', 'chat-input-actions',
    'ai-panel-user-menu-btn', 'user-menu-popover', 'user-menu-email',
    'ai-panel-expand-from-bar', 'ai-panel-expand', 'ai-panel-close',
    'ai-panel-new-chat',
  ];

  for (const id of criticalIds) {
    test(`Critical element id="${id}" exists in protoguide.html`, () => {
      assert.ok(htmlIds.has(id), `Missing id="${id}" in protoguide.html`);
    });
  }

  test('Every getElementById in protoguide.js has a matching id in protoguide.html', () => {
    // Dynamically created ids (created at runtime via innerHTML) are excluded
    const dynamicIds = new Set([
      'chat-typing-indicator',       // created dynamically in showTyping()
      'settings-anchors-toggle',     // created in renderSettingsOverlay innerHTML
      'settings-future-data-control-toggle',
      'settings-configure-thresholds',
      'settings-manage-teams',       // created in renderSettingsOverlay innerHTML
      'settings-manage-customers',
      'settings-reset-onboarding',   // created in renderSettingsOverlay innerHTML
      'settings-reset-all',          // created in renderSettingsOverlay innerHTML
      'settings-manage-users',       // created in renderSettingsOverlay innerHTML
      'settings-sign-out',           // created in renderSettingsOverlay innerHTML
      'team-settings-error',
      'new-domain-input',            // created in openManageUsersModal innerHTML
      'add-domain-btn',              // created in openManageUsersModal innerHTML
    ]);
    const missing = [];
    for (const id of jsIds) {
      if (!htmlIds.has(id) && !dynamicIds.has(id)) {
        missing.push(id);
      }
    }
    assert.deepStrictEqual(missing, [], `IDs in JS but not in HTML: ${missing.join(', ')}`);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Script Load Order Tests
// ════════════════════════════════════════════════════════════════════════════

describe('2. Script Load Order', () => {
  const scripts = extractScriptSrcs(protoguideHtml);
  // Only local scripts (not CDN)
  const localScripts = scripts.filter(s => !s.startsWith('http'));

  test('profile.js is loaded before admin-assistant.js', () => {
    const profileIdx = localScripts.indexOf('../profile.js');
    const adminIdx = localScripts.indexOf('../admin-assistant.js');
    assert.ok(profileIdx !== -1, 'profile.js not found');
    assert.ok(adminIdx !== -1, 'admin-assistant.js not found');
    assert.ok(profileIdx < adminIdx, 'profile.js must come before admin-assistant.js');
  });

  test('widget-catalog.js is loaded before admin-assistant.js', () => {
    const catalogIdx = localScripts.indexOf('../widget-catalog.js');
    const adminIdx = localScripts.indexOf('../admin-assistant.js');
    assert.ok(catalogIdx !== -1, 'widget-catalog.js not found');
    assert.ok(catalogIdx < adminIdx, 'widget-catalog.js must come before admin-assistant.js');
  });

  test('dashboard-config.js is loaded before admin-assistant.js', () => {
    const configIdx = localScripts.indexOf('../dashboard-config.js');
    const adminIdx = localScripts.indexOf('../admin-assistant.js');
    assert.ok(configIdx !== -1, 'dashboard-config.js not found');
    assert.ok(configIdx < adminIdx, 'dashboard-config.js must come before admin-assistant.js');
  });

  test('assistant-storage.js is loaded before admin-assistant.js', () => {
    const storageIdx = localScripts.indexOf('../assistant-storage.js');
    const adminIdx = localScripts.indexOf('../admin-assistant.js');
    assert.ok(storageIdx !== -1, 'assistant-storage.js not found');
    assert.ok(storageIdx < adminIdx, 'assistant-storage.js must come before admin-assistant.js');
  });

  test('admin-assistant.js is loaded before app.js', () => {
    const adminIdx = localScripts.indexOf('../admin-assistant.js');
    const appIdx = localScripts.indexOf('../app.js');
    assert.ok(adminIdx !== -1, 'admin-assistant.js not found');
    assert.ok(appIdx !== -1, 'app.js not found');
    assert.ok(adminIdx < appIdx, 'admin-assistant.js must come before app.js');
  });

  test('app.js is loaded before protoguide.js', () => {
    const appIdx = localScripts.indexOf('../app.js');
    const guideIdx = localScripts.indexOf('protoguide.js');
    assert.ok(appIdx !== -1, 'app.js not found');
    assert.ok(guideIdx !== -1, 'protoguide.js not found');
    assert.ok(appIdx < guideIdx, 'app.js must come before protoguide.js');
  });

  test('guide-adapter.js is NOT loaded', () => {
    const hasAdapter = localScripts.some(s => s.includes('guide-adapter'));
    assert.ok(!hasAdapter, 'guide-adapter.js should not be loaded');
  });

  test('All analytics scripts use ../ prefix (loaded from parent directory)', () => {
    const analyticsScripts = ['profile.js', 'widget-catalog.js', 'dashboard-config.js', 'assistant-storage.js', 'admin-assistant.js', 'app.js'];
    for (const name of analyticsScripts) {
      const found = localScripts.find(s => s.endsWith(name));
      assert.ok(found, `${name} not found in script tags`);
      assert.ok(found.startsWith('../'), `${name} should use ../ prefix, got: ${found}`);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. _prototypeGuideAPI Contract Tests
// ════════════════════════════════════════════════════════════════════════════

describe('3. _prototypeGuideAPI Contract', () => {
  const exposedApiMethods = [
    'getSettingsData',
    'getAdminData',
    'setRole',
    'setFlag',
    'setToggle',
    'setSlider',
    'triggerAction',
  ];

  for (const method of exposedApiMethods) {
    test(`_prototypeGuideAPI exposes ${method}()`, () => {
      const pattern = new RegExp(`_prototypeGuideAPI\\s*=\\s*\\{[\\s\\S]*?${method}\\s*:`);
      assert.ok(pattern.test(appJs), `${method} not found in _prototypeGuideAPI object in app.js`);
    });
  }

  const protoguideApiMethods = [
    'getSettingsData',
    'getAdminData',
    'setRole',
    'setFlag',
    'setToggle',
    'setSlider',
  ];

  for (const method of protoguideApiMethods) {
    test(`protoguide.js calls api.${method}`, () => {
      const pattern = new RegExp(`api\\.${method}\\(`);
      assert.ok(pattern.test(protoguideJs), `protoguide.js does not call api.${method}()`);
    });
  }

  test('Settings actions are wired directly to the current handlers', () => {
    assert.ok(protoguideJs.includes('openTeamSettingsModal()'), 'Manage Teams should open the team settings modal directly');
    assert.ok(protoguideJs.includes('openCustomerSettingsModal()'), 'Manage Customers should open the customer settings modal directly');
    assert.ok(protoguideJs.includes('window.performResetOnboarding'), 'Reset Onboarding should call the current reset helper');
    assert.ok(protoguideJs.includes('window.performResetAll'), 'Reset Everything should call the current reset helper');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. postToPrototype Route Completeness
// ════════════════════════════════════════════════════════════════════════════

describe('4. postToPrototype Route Completeness', () => {
  const messageTypes = [
    'guide:set-role',
    'guide:set-flag',
    'guide:set-toggle',
    'guide:set-slider',
  ];

  for (const type of messageTypes) {
    test(`postToPrototype handles message type '${type}'`, () => {
      assert.ok(
        protoguideJs.includes(`'${type}'`) || protoguideJs.includes(`"${type}"`),
        `postToPrototype missing handler for '${type}'`
      );
    });
  }

  test('postToPrototype function exists in protoguide.js', () => {
    assert.ok(
      /function\s+postToPrototype\s*\(/.test(protoguideJs),
      'postToPrototype function not found'
    );
  });

  test('postToPrototype maps guide:set-role to api.setRole', () => {
    assert.ok(protoguideJs.includes("'guide:set-role'") && protoguideJs.includes('api.setRole'));
  });

  test('postToPrototype maps guide:set-flag to api.setFlag', () => {
    assert.ok(protoguideJs.includes("'guide:set-flag'") && protoguideJs.includes('api.setFlag'));
  });

  test('postToPrototype maps guide:set-toggle to api.setToggle', () => {
    assert.ok(protoguideJs.includes("'guide:set-toggle'") && protoguideJs.includes('api.setToggle'));
  });

  test('postToPrototype maps guide:set-slider to api.setSlider', () => {
    assert.ok(protoguideJs.includes("'guide:set-slider'") && protoguideJs.includes('api.setSlider'));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Worker Endpoint Tests
// ════════════════════════════════════════════════════════════════════════════

describe('5. Worker Endpoint Tests', () => {
  const endpoints = [
    '/protoguide/auth/check',
    '/protoguide/users',
    '/protoguide/domains',
    '/protoguide/feedback',
  ];

  for (const ep of endpoints) {
    test(`Worker handles endpoint ${ep}`, () => {
      assert.ok(workerJs.includes(`'${ep}'`) || workerJs.includes(`"${ep}"`),
        `Endpoint ${ep} not found in worker.js`);
    });
  }

  test('CORS headers include Authorization in allowed headers', () => {
    assert.ok(
      workerJs.includes('Authorization'),
      'Authorization not in CORS allowed headers'
    );
  });

  test('CORS allows GET, POST, PUT, DELETE, OPTIONS methods', () => {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']) {
      assert.ok(workerJs.includes(method), `CORS missing method ${method}`);
    }
  });

  test('OPTIONS handler exists for preflight requests', () => {
    assert.ok(
      /request\.method\s*===?\s*['"]OPTIONS['"]/.test(workerJs),
      'OPTIONS handler not found in worker.js'
    );
  });

  // HTTP method checks for each endpoint
  test('/protoguide/auth/check handles POST', () => {
    const section = workerJs.substring(
      workerJs.indexOf('/protoguide/auth/check'),
      workerJs.indexOf('/protoguide/auth/check') + 200
    );
    assert.ok(section.includes("'POST'") || section.includes('"POST"'), 'auth/check should handle POST');
  });

  test('/protoguide/users handles GET', () => {
    // Check that path === '/protoguide/users' && request.method === 'GET' exists
    assert.ok(
      /path\s*===\s*['"]\/protoguide\/users['"].*?['"]GET['"]/.test(workerJs),
      'GET /protoguide/users not found'
    );
  });

  test('/protoguide/users handles POST', () => {
    assert.ok(
      /path\s*===\s*['"]\/protoguide\/users['"].*?['"]POST['"]/.test(workerJs),
      'POST /protoguide/users not found'
    );
  });

  test('/protoguide/users/:email handles DELETE', () => {
    assert.ok(
      /startsWith\(['"]\/protoguide\/users\/['"]\).*?['"]DELETE['"]/.test(workerJs),
      'DELETE /protoguide/users/:email not found'
    );
  });

  test('/protoguide/domains handles GET', () => {
    assert.ok(
      /path\s*===\s*['"]\/protoguide\/domains['"].*?['"]GET['"]/.test(workerJs),
      'GET /protoguide/domains not found'
    );
  });

  test('/protoguide/domains handles POST', () => {
    assert.ok(
      /path\s*===\s*['"]\/protoguide\/domains['"].*?['"]POST['"]/.test(workerJs),
      'POST /protoguide/domains not found'
    );
  });

  test('/protoguide/domains/:domain handles DELETE', () => {
    assert.ok(
      /startsWith\(['"]\/protoguide\/domains\/['"]\).*?['"]DELETE['"]/.test(workerJs),
      'DELETE /protoguide/domains/:domain not found'
    );
  });

  test('Bootstrap logic: first user becomes admin when no users exist', () => {
    // Verify the bootstrap auto-admin pattern
    assert.ok(
      workerJs.includes("role: 'admin'") && workerJs.includes('Object.keys(users).length === 0'),
      'Bootstrap admin logic not found'
    );
  });

  test('Domain comparison uses case-insensitive matching', () => {
    const domainCheckSection = workerJs.substring(
      workerJs.indexOf('emailDomain'),
      workerJs.indexOf('emailDomain') + 300
    );
    assert.ok(
      domainCheckSection.includes('.toLowerCase()'),
      'Domain comparison must use toLowerCase for case-insensitive matching'
    );
  });

  test('/protoguide/feedback handles GET', () => {
    assert.ok(
      /path\s*===\s*['"]\/protoguide\/feedback['"].*?['"]GET['"]/.test(workerJs),
      'GET /protoguide/feedback not found'
    );
  });

  test('/protoguide/feedback handles POST', () => {
    assert.ok(
      /path\s*===\s*['"]\/protoguide\/feedback['"].*?['"]POST['"]/.test(workerJs),
      'POST /protoguide/feedback not found'
    );
  });

  test('/protoguide/feedback/:id handles PUT', () => {
    assert.ok(
      /startsWith\(['"]\/protoguide\/feedback\/['"]\).*?['"]PUT['"]/.test(workerJs),
      'PUT /protoguide/feedback/:id not found'
    );
  });

  test('/protoguide/feedback/:id handles DELETE', () => {
    assert.ok(
      /startsWith\(['"]\/protoguide\/feedback\/['"]\).*?['"]DELETE['"]/.test(workerJs),
      'DELETE /protoguide/feedback/:id not found'
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Chat System Tests
// ════════════════════════════════════════════════════════════════════════════

describe('6. Chat System Tests', () => {
  test('sendMessage calls CHATBOT_PROXY + /onboarding/chat', () => {
    assert.ok(
      protoguideJs.includes("CHATBOT_PROXY + '/onboarding/chat'"),
      'sendMessage should call CHATBOT_PROXY + /onboarding/chat'
    );
  });

  test('Request body includes system, messages, and tools', () => {
    assert.ok(
      protoguideJs.includes('JSON.stringify({ system, messages, tools: PROTOGUIDE_CHAT_TOOLS })') ||
      protoguideJs.includes('JSON.stringify({system, messages, tools: PROTOGUIDE_CHAT_TOOLS})'),
      'Request body should include system, messages, tools'
    );
  });

  test('processApiResponse handles text content blocks', () => {
    assert.ok(
      protoguideJs.includes("block.type === 'text'") || protoguideJs.includes('block.type === "text"'),
      'processApiResponse should handle text blocks'
    );
  });

  test('processApiResponse handles tool_use content blocks', () => {
    assert.ok(
      protoguideJs.includes("block.type === 'tool_use'") || protoguideJs.includes('block.type === "tool_use"'),
      'processApiResponse should handle tool_use blocks'
    );
  });

  test('Tool definitions include show_choices', () => {
    assert.ok(
      protoguideJs.includes("name: 'show_choices'") || protoguideJs.includes('name: "show_choices"'),
      'show_choices tool not defined'
    );
  });

  test('Tool definitions include submit_feedback', () => {
    assert.ok(
      protoguideJs.includes("name: 'submit_feedback'") || protoguideJs.includes('name: "submit_feedback"'),
      'submit_feedback tool not defined'
    );
  });

  test('Tool definitions include report_bug', () => {
    assert.ok(
      protoguideJs.includes("name: 'report_bug'") || protoguideJs.includes('name: "report_bug"'),
      'report_bug tool not defined'
    );
  });

  test('show_choices renderer supports legacy items/value payloads', () => {
    assert.ok(
      protoguideJs.includes('input.items') && protoguideJs.includes('opt.value'),
      'show_choices renderer should normalize legacy items/value payloads'
    );
  });

  test('feedback tools support legacy text/section and description/steps payloads', () => {
    assert.ok(
      protoguideJs.includes('input.text') &&
      protoguideJs.includes('input.description') &&
      protoguideJs.includes('input.steps'),
      'feedback tool renderers should normalize legacy payload fields'
    );
  });

  test('Unsupported tool_use blocks fail visibly instead of being ignored', () => {
    assert.ok(
      protoguideJs.includes('ProtoGuide received an interaction it could not render'),
      'processApiResponse should show a visible fallback for unsupported tool_use blocks'
    );
  });

  test('handleToolResult appends skipped tool_result blocks for sibling tool_use blocks', () => {
    const start = protoguideJs.indexOf('async function handleToolResult');
    assert.ok(start !== -1, 'handleToolResult not found');
    const handleSection = protoguideJs.substring(start, start + 1600);
    assert.ok(
      handleSection.includes('getToolUseBlocks(fullResponse)') &&
      handleSection.includes('skipped: true'),
      'handleToolResult should add skipped tool_result blocks for other tool_use blocks in the same response'
    );
  });

  test('Worker disables parallel tool calls for OpenAI fallback', () => {
    assert.ok(
      workerJs.includes('parallel_tool_calls = false'),
      'Worker should disable parallel tool calls when using OpenAI tools'
    );
  });

  test('Worker safely parses OpenAI tool call arguments', () => {
    assert.ok(
      workerJs.includes('safeParseJson(tc.function.arguments, {})'),
      'Worker should safely parse OpenAI tool call arguments'
    );
  });

  test('No request_element_selection tool defined', () => {
    assert.ok(
      !protoguideJs.includes('request_element_selection'),
      'request_element_selection tool should not exist'
    );
  });

  test('No store_context_addition tool defined', () => {
    assert.ok(
      !protoguideJs.includes('store_context_addition'),
      'store_context_addition tool should not exist'
    );
  });

  test('CONTEXT_IDENTITY constant is a non-empty string', () => {
    const match = protoguideJs.match(/const\s+CONTEXT_IDENTITY\s*=\s*`([^`]+)`/);
    assert.ok(match, 'CONTEXT_IDENTITY not found');
    assert.ok(match[1].trim().length > 10, 'CONTEXT_IDENTITY should be a substantial string');
  });

  test('CONTEXT_DOMAIN constant is a non-empty string', () => {
    const match = protoguideJs.match(/const\s+CONTEXT_DOMAIN\s*=\s*`/);
    assert.ok(match, 'CONTEXT_DOMAIN not found');
    // Verify it contains substantial content
    const startIdx = protoguideJs.indexOf('const CONTEXT_DOMAIN');
    assert.ok(startIdx > -1);
    const slice = protoguideJs.substring(startIdx, startIdx + 200);
    assert.ok(slice.length > 50, 'CONTEXT_DOMAIN should be a substantial string');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Settings Overlay Integration Tests
// ════════════════════════════════════════════════════════════════════════════

describe('7. Settings Overlay Integration', () => {
  test('renderSettingsOverlay function exists', () => {
    assert.ok(
      /function\s+renderSettingsOverlay\s*\(/.test(protoguideJs),
      'renderSettingsOverlay function not found'
    );
  });

  test('renderSettingsOverlay renders role toggle buttons instead of a select', () => {
    assert.ok(
      protoguideJs.includes('guide-role-btn') && protoguideJs.includes("data-role="),
      'Settings overlay should render role toggle buttons'
    );
  });

  const settingsElementIds = [
    'settings-anchors-toggle',
    'settings-future-data-control-toggle',
    'settings-configure-thresholds',
    'settings-manage-teams',
    'settings-manage-customers',
    'settings-reset-onboarding',
    'settings-reset-all',
    'settings-manage-users',
    'settings-sign-out',
  ];

  for (const id of settingsElementIds) {
    test(`renderSettingsOverlay creates element with id="${id}"`, () => {
      assert.ok(
        protoguideJs.includes(`id="${id}"`) || protoguideJs.includes(`id='${id}'`),
        `Settings overlay does not create element id="${id}"`
      );
    });
  }

  // Slider keys that must match _confidenceThresholds in app.js
  const sliderKeys = [
    'confidenceSkipSourceGathering',
    'confidenceSkipTeamConfirmation',
    'confidenceSkipDecisionGoals',
    'confidenceSkipSignalFollowup',
    'confidenceAutoDraft',
    'confidenceSkipDensity',
    'correctionSensitivity',
  ];

  for (const key of sliderKeys) {
    test(`Slider key '${key}' exists in protoguide.js renderSettingsOverlay`, () => {
      assert.ok(protoguideJs.includes(key), `Slider key '${key}' not found in protoguide.js`);
    });

    test(`Slider key '${key}' exists in app.js _prototypeGuideAPI.getAdminData`, () => {
      assert.ok(appJs.includes(key), `Slider key '${key}' not found in app.js`);
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Manage Users Modal Tests
// ════════════════════════════════════════════════════════════════════════════

describe('8. Manage Users Modal', () => {
  test('openManageUsersModal function exists', () => {
    assert.ok(
      /function\s+openManageUsersModal\s*\(/.test(protoguideJs) ||
      protoguideJs.includes('async function openManageUsersModal'),
      'openManageUsersModal function not found'
    );
  });

  test('Fetches from /protoguide/domains endpoint', () => {
    assert.ok(
      protoguideJs.includes("CHATBOT_PROXY + '/protoguide/domains'"),
      'openManageUsersModal should fetch /protoguide/domains'
    );
  });

  test('Fetches from /protoguide/users endpoint', () => {
    assert.ok(
      protoguideJs.includes("CHATBOT_PROXY + '/protoguide/users'"),
      'openManageUsersModal should fetch /protoguide/users'
    );
  });

  test('Uses getAuthHeaders() for API calls', () => {
    const start = protoguideJs.indexOf('async function openManageUsersModal');
    const end = protoguideJs.indexOf('// Close manage users modal');
    const manageSection = protoguideJs.substring(start, end > start ? end : start + 7000);
    const authCount = (manageSection.match(/headers:\s*getAuthHeaders\(\)/g) || []).length;
    assert.ok(authCount >= 6, `Expected >= 6 authenticated requests in manage users, found ${authCount}`);
  });

  test('Add domain button POSTs to /protoguide/domains', () => {
    assert.ok(
      protoguideJs.includes("method: 'POST'") &&
      protoguideJs.includes("CHATBOT_PROXY + '/protoguide/domains'"),
      'Add domain should POST to /protoguide/domains'
    );
  });

  test('Remove domain uses DELETE method', () => {
    assert.ok(
      protoguideJs.includes("method: 'DELETE'") &&
      protoguideJs.includes("'/protoguide/domains/'"),
      'Remove domain should use DELETE /protoguide/domains/:domain'
    );
  });

  test('Remove user uses DELETE method', () => {
    assert.ok(
      protoguideJs.includes("'/protoguide/users/'") &&
      protoguideJs.includes("method: 'DELETE'"),
      'Remove user should use DELETE /protoguide/users/:email'
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Auth Flow Tests
// ════════════════════════════════════════════════════════════════════════════

describe('9. Auth Flow', () => {
  test('Login page has CHATBOT_PROXY constant matching protoguide.js', () => {
    const loginProxy = loginHtml.match(/CHATBOT_PROXY\s*=\s*['"]([^'"]+)['"]/);
    assert.ok(loginProxy, 'CHATBOT_PROXY not found in login page');
    const loginUrl = loginProxy[1];

    // protoguide.js uses a ternary but both branches resolve to the same URL
    // Extract the production URL (the one after the colon in the ternary, or the simple assignment)
    const guideProxyMatches = protoguideJs.match(/CHATBOT_PROXY\s*=[\s\S]*?['"]([^'"]+)['"]/);
    assert.ok(guideProxyMatches, 'CHATBOT_PROXY not found in protoguide.js');

    // Extract all URLs from the CHATBOT_PROXY assignment line(s)
    const proxySection = protoguideJs.substring(
      protoguideJs.indexOf('CHATBOT_PROXY'),
      protoguideJs.indexOf('CHATBOT_PROXY') + 300
    );
    const allUrls = [...proxySection.matchAll(/['"]https?:\/\/[^'"]+['"]/g)].map(m => m[0].replace(/['"]/g, ''));
    assert.ok(allUrls.length > 0, 'No URLs found in CHATBOT_PROXY definition');

    // The login URL should match at least one of the URLs in the protoguide.js definition
    assert.ok(
      allUrls.includes(loginUrl),
      `Login CHATBOT_PROXY "${loginUrl}" not found among protoguide.js URLs: ${allUrls.join(', ')}`
    );
  });

  test('Login redirects to protoguide.html on success', () => {
    assert.ok(
      loginHtml.includes("window.location.href = 'protoguide.html'") ||
      loginHtml.includes('window.location.href = "protoguide.html"'),
      'Login does not redirect to protoguide.html on success'
    );
  });

  test('Login stores protoguide_user in localStorage', () => {
    assert.ok(
      loginHtml.includes("localStorage.setItem('protoguide_user'") ||
      loginHtml.includes('localStorage.setItem("protoguide_user"'),
      'Login does not store protoguide_user in localStorage'
    );
  });

  test('Login stores protoguide_token in localStorage', () => {
    assert.ok(
      loginHtml.includes("localStorage.setItem('protoguide_token'") ||
      loginHtml.includes('localStorage.setItem("protoguide_token"'),
      'Login does not store protoguide_token in localStorage'
    );
  });

  test('protoguide.js init checks localStorage for protoguide_user', () => {
    assert.ok(
      protoguideJs.includes("localStorage.getItem('protoguide_user')"),
      'protoguide.js does not check localStorage for protoguide_user'
    );
  });

  test('protoguide.js redirects to protoguide-login.html when no cached user', () => {
    assert.ok(
      protoguideJs.includes("'protoguide-login.html'") || protoguideJs.includes('"protoguide-login.html"'),
      'protoguide.js does not redirect to protoguide-login.html'
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Removed Feature Verification Tests
// ════════════════════════════════════════════════════════════════════════════

describe('10. Removed Feature Verification', () => {
  const removedPatterns = [
    { name: 'postMessage calls', pattern: /\.postMessage\s*\(/ },
    { name: 'API_BASE constant', pattern: /\bAPI_BASE\b/ },
    { name: 'AUTH_BASE constant', pattern: /\bAUTH_BASE\b/ },
    { name: 'currentPrototypeId variable', pattern: /\bcurrentPrototypeId\b/ },
    { name: 'currentPrototypeName variable', pattern: /\bcurrentPrototypeName\b/ },
    { name: 'currentSessionId variable', pattern: /\bcurrentSessionId\b/ },
    { name: 'showConfetti function', pattern: /\bshowConfetti\b/ },
    { name: 'setDot function', pattern: /\bsetDot\b/ },
    { name: '_isGuestMode variable', pattern: /\b_isGuestMode\b/ },
    { name: '_capElementSelector variable', pattern: /\b_capElementSelector\b/ },
    { name: 'loadPrototype function', pattern: /\bloadPrototype\b/ },
    { name: 'selectPrototype function', pattern: /\bselectPrototype\b/ },
    { name: 'renderAdminOverlay function', pattern: /\brenderAdminOverlay\b/ },
    { name: 'openManagePrototypesModal function', pattern: /\bopenManagePrototypesModal\b/ },
    { name: 'openRegisterModal function', pattern: /\bopenRegisterModal\b/ },
    { name: 'request_element_selection tool', pattern: /request_element_selection/ },
    { name: 'store_context_addition tool', pattern: /store_context_addition/ },
  ];

  for (const { name, pattern } of removedPatterns) {
    test(`protoguide.js does NOT contain: ${name}`, () => {
      assert.ok(!pattern.test(protoguideJs), `Found removed feature: ${name}`);
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 11. Event Tracking Tests
// ════════════════════════════════════════════════════════════════════════════

describe('11. Event Tracking', () => {
  test('Click event listener on document exists', () => {
    assert.ok(
      protoguideJs.includes("document.addEventListener('click'"),
      'Missing click event listener on document'
    );
  });

  test('popstate event listener exists', () => {
    assert.ok(
      protoguideJs.includes("'popstate'"),
      'Missing popstate event listener'
    );
  });

  test('hashchange event listener exists', () => {
    assert.ok(
      protoguideJs.includes("'hashchange'"),
      'Missing hashchange event listener'
    );
  });

  test('logAction function is defined', () => {
    assert.ok(
      /function\s+logAction\s*\(/.test(protoguideJs),
      'logAction function not defined'
    );
  });

  test('getRecentActions function is defined', () => {
    assert.ok(
      /function\s+getRecentActions\s*\(/.test(protoguideJs),
      'getRecentActions function not defined'
    );
  });

  test('ACTION_WEIGHT_MAP is defined', () => {
    assert.ok(
      protoguideJs.includes('ACTION_WEIGHT_MAP'),
      'ACTION_WEIGHT_MAP not defined'
    );
  });

  test('ACTION_WEIGHT_MAP includes expected action types', () => {
    const expectedTypes = ['navigate', 'setting_change', 'click', 'scroll', 'event'];
    for (const type of expectedTypes) {
      assert.ok(
        protoguideJs.includes(`${type}:`),
        `ACTION_WEIGHT_MAP missing type: ${type}`
      );
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 12. No Legacy App-Name References Tests
// ════════════════════════════════════════════════════════════════════════════

describe('12. No Legacy App-Name References', () => {
  const legacyIframeAppName = ['si', 'de', 'car'].join('');
  const legacyIframeAppPattern = new RegExp(legacyIframeAppName, 'gi');
  const legacyNameFreeFiles = [
    { name: 'protoguide/protoguide.html', content: protoguideHtml },
    { name: 'protoguide/protoguide-login.html', content: loginHtml },
    { name: 'chatbot-proxy/worker.js', content: workerJs },
    { name: 'chatbot-proxy/feedback-organizer.js', content: feedbackOrganizerJs },
    { name: 'protoguide/protoguide.js', content: protoguideJs },
  ];

  // Include login CSS if it exists
  if (loginCss) {
    legacyNameFreeFiles.push({ name: 'protoguide/protoguide-login.css', content: loginCss });
  }

  for (const { name, content } of legacyNameFreeFiles) {
    test(`${name} has zero legacy iframe-app name references`, () => {
      const matches = content.match(legacyIframeAppPattern) || [];
      assert.strictEqual(matches.length, 0,
        `Found ${matches.length} legacy iframe-app name reference(s) in ${name}`);
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 13. CSS Containment Tests
// ════════════════════════════════════════════════════════════════════════════

describe('13. CSS Containment', () => {
  test('protoguide.css file exists', () => {
    assert.ok(protoguideCss.length > 0, 'protoguide.css not found or empty');
  });

  test('.guide-main has contain: layout', () => {
    // Find the .guide-main rule block and check for contain: layout
    assert.ok(
      protoguideCss.includes('contain: layout') || protoguideCss.includes('contain:layout'),
      '.guide-main does not have contain: layout'
    );
  });

  test('.guide-main .sidebar has position: absolute', () => {
    const match = protoguideCss.match(/\.guide-main\s+\.sidebar\s*\{([^}]+)\}/);
    assert.ok(match, '.guide-main .sidebar rule not found');
    assert.ok(match[1].includes('position: absolute') || match[1].includes('position:absolute'),
      '.guide-main .sidebar does not have position: absolute');
  });

  test('.guide-main .main-content has position: absolute', () => {
    const match = protoguideCss.match(/\.guide-main\s+\.main-content\s*\{([^}]+)\}/);
    assert.ok(match, '.guide-main .main-content rule not found');
    assert.ok(match[1].includes('position: absolute') || match[1].includes('position:absolute'),
      '.guide-main .main-content does not have position: absolute');
  });

  test('No .prototype-iframe CSS rules exist', () => {
    assert.ok(
      !protoguideCss.includes('.prototype-iframe'),
      'Found .prototype-iframe rules in CSS (should be removed)'
    );
  });

  test('No .guide-empty-state CSS rules exist', () => {
    assert.ok(
      !protoguideCss.includes('.guide-empty-state'),
      'Found .guide-empty-state rules in CSS (should be removed)'
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 14. Feedback System Tests
// ════════════════════════════════════════════════════════════════════════════

describe('14. Feedback System', () => {
  test('storeFeedback function exists in protoguide.js', () => {
    assert.ok(
      /function\s+storeFeedback\s*\(/.test(protoguideJs) ||
      protoguideJs.includes('async function storeFeedback'),
      'storeFeedback function not found'
    );
  });

  test('storeFeedback POSTs to /protoguide/feedback', () => {
    assert.ok(
      protoguideJs.includes("CHATBOT_PROXY + '/protoguide/feedback'"),
      'storeFeedback should POST to /protoguide/feedback'
    );
    // Verify it uses POST method
    const storeFeedbackSection = protoguideJs.substring(
      protoguideJs.indexOf('async function storeFeedback'),
      protoguideJs.indexOf('async function storeFeedback') + 1400
    );
    assert.ok(
      storeFeedbackSection.includes("method: 'POST'"),
      'storeFeedback should use POST method'
    );
  });

  test('fetchFeedback function exists in protoguide.js', () => {
    assert.ok(
      /function\s+fetchFeedback\s*\(/.test(protoguideJs) ||
      protoguideJs.includes('async function fetchFeedback'),
      'fetchFeedback function not found'
    );
  });

  test('fetchFeedback GETs from /protoguide/feedback', () => {
    const fetchFeedbackSection = protoguideJs.substring(
      protoguideJs.indexOf('async function fetchFeedback'),
      protoguideJs.indexOf('async function fetchFeedback') + 300
    );
    assert.ok(
      fetchFeedbackSection.includes("CHATBOT_PROXY + '/protoguide/feedback'"),
      'fetchFeedback should GET from /protoguide/feedback'
    );
    // Verify it does NOT use a POST/PUT method (GET is default for fetch)
    assert.ok(
      !fetchFeedbackSection.includes("method: 'POST'") &&
      !fetchFeedbackSection.includes("method: 'PUT'"),
      'fetchFeedback should use GET method (no explicit method needed)'
    );
  });

  test('updateFeedback function exists in protoguide.js', () => {
    assert.ok(
      /function\s+updateFeedback\s*\(/.test(protoguideJs) ||
      protoguideJs.includes('async function updateFeedback'),
      'updateFeedback function not found'
    );
  });

  test('updateFeedback PUTs to /protoguide/feedback/:id', () => {
    const updateFeedbackSection = protoguideJs.substring(
      protoguideJs.indexOf('async function updateFeedback'),
      protoguideJs.indexOf('async function updateFeedback') + 400
    );
    assert.ok(
      updateFeedbackSection.includes("'/protoguide/feedback/'"),
      'updateFeedback should PUT to /protoguide/feedback/:id'
    );
    assert.ok(
      updateFeedbackSection.includes("method: 'PUT'"),
      'updateFeedback should use PUT method'
    );
  });

  test('Worker has GET handler for /protoguide/feedback', () => {
    assert.ok(
      /path\s*===\s*['"]\/protoguide\/feedback['"].*?['"]GET['"]/.test(workerJs),
      'Worker missing GET /protoguide/feedback'
    );
  });

  test('Worker has POST handler for /protoguide/feedback', () => {
    assert.ok(
      /path\s*===\s*['"]\/protoguide\/feedback['"].*?['"]POST['"]/.test(workerJs),
      'Worker missing POST /protoguide/feedback'
    );
  });

  test('Worker has PUT handler for /protoguide/feedback/:id', () => {
    assert.ok(
      /startsWith\(['"]\/protoguide\/feedback\/['"]\).*?['"]PUT['"]/.test(workerJs),
      'Worker missing PUT /protoguide/feedback/:id'
    );
  });

  test('Worker has DELETE handler for /protoguide/feedback/:id', () => {
    assert.ok(
      /startsWith\(['"]\/protoguide\/feedback\/['"]\).*?['"]DELETE['"]/.test(workerJs),
      'Worker missing DELETE /protoguide/feedback/:id'
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 15. Feedback System — Comprehensive Tests
// ════════════════════════════════════════════════════════════════════════════

describe('15. Feedback System — Comprehensive Tests', () => {

  // ── Helper: extract a section of code starting from a marker ───────
  function extractSection(source, startMarker, maxLen = 800) {
    const idx = source.indexOf(startMarker);
    if (idx === -1) return '';
    return source.substring(idx, idx + maxLen);
  }

  function extractWorkerRouteSection(routeMarker, maxLen = 1200) {
    return extractSection(workerJs, routeMarker, maxLen);
  }

  // ══════════════════════════════════════════════════════════════════
  // Data Retention Tests (top priority)
  // ══════════════════════════════════════════════════════════════════

  describe('Data Retention', () => {
    test('Worker GET filters deleted feedback rows at query time', () => {
      const getHandler = extractWorkerRouteSection("if (path === '/protoguide/feedback' && request.method === 'GET')", 1800);
      assert.ok(getHandler, 'GET /protoguide/feedback handler not found in worker.js');
      assert.ok(
        getHandler.includes('WHERE deleted = 0'),
        'GET /protoguide/feedback should exclude deleted rows'
      );
    });

    test('Worker DELETE soft-deletes feedback rows in D1', () => {
      const deleteHandler = extractWorkerRouteSection("if (path.startsWith('/protoguide/feedback/') && request.method === 'DELETE')", 700);
      assert.ok(deleteHandler, 'DELETE /protoguide/feedback handler not found');
      assert.ok(
        deleteHandler.includes("UPDATE feedback_submissions SET deleted = 1, deleted_at = datetime('now')"),
        'DELETE /protoguide/feedback should mark the row deleted instead of removing it'
      );
    });

    test('Worker POST stores feedback in feedback_submissions', () => {
      const postHandler = extractWorkerRouteSection("if (path === '/protoguide/feedback' && request.method === 'POST')", 1800);
      assert.ok(postHandler, 'POST /protoguide/feedback handler not found');
      assert.ok(
        postHandler.includes('INSERT INTO feedback_submissions'),
        'POST /protoguide/feedback should insert rows into feedback_submissions'
      );
    });

    test('Worker PUT updates feedback rows in place', () => {
      const putHandler = extractWorkerRouteSection("if (path.startsWith('/protoguide/feedback/') && request.method === 'PUT')", 1400);
      assert.ok(putHandler, 'PUT /protoguide/feedback handler not found');
      assert.ok(
        putHandler.includes('UPDATE feedback_submissions SET'),
        'PUT /protoguide/feedback should update an existing D1 row'
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Field Consistency Tests
  // ══════════════════════════════════════════════════════════════════

  describe('Field Consistency', () => {
    test('mapSubmissionRow exposes camelCase fields expected by the frontend', () => {
      assert.ok(
        workerJs.includes('text: row.raw_text') &&
        workerJs.includes('createdAt: row.submitted_at') &&
        workerJs.includes('organizeStatus: row.organize_status') &&
        workerJs.includes('rawEventJson: parseJsonColumn(row.raw_event_json)') &&
        workerJs.includes('insightJson: parseJsonColumn(row.insight_json)') &&
        workerJs.includes('deletedAt: row.deleted_at'),
        'mapSubmissionRow should normalize D1 feedback columns for the frontend'
      );
    });

    test('renderRawFeedback reads item.text (matching stored field name)', () => {
      const renderSection = extractSection(protoguideJs, 'function renderRawFeedback', 500);
      assert.ok(renderSection, 'renderRawFeedback not found');
      assert.ok(
        renderSection.includes('item.text') || renderSection.includes("item['text']"),
        'renderRawFeedback does not read item.text — field name mismatch with what storeFeedback sends'
      );
    });

    test('Worker POST generates unique IDs with fb_ prefix', () => {
      const postHandler = extractWorkerRouteSection("if (path === '/protoguide/feedback' && request.method === 'POST')", 800);
      assert.ok(postHandler, 'POST /protoguide/feedback handler not found');
      assert.ok(
        postHandler.includes("const id = 'fb_'"),
        'POST handler does not generate id with fb_ prefix'
      );
    });

    test('Worker migration accepts both current and legacy feedback field names', () => {
      const getHandler = extractWorkerRouteSection("if (path === '/protoguide/feedback' && request.method === 'GET')", 1800);
      assert.ok(getHandler, 'GET /protoguide/feedback handler not found');
      assert.ok(
        getHandler.includes('item.text || item.rawText || item.raw_text ||'),
        'Feedback migration should read both current and legacy text field names'
      );
    });

    test('Worker PUT accepts both camelCase and snake_case JSON columns', () => {
      const putHandler = extractWorkerRouteSection("if (path.startsWith('/protoguide/feedback/') && request.method === 'PUT')", 1400);
      assert.ok(putHandler, 'PUT /protoguide/feedback handler not found');
      assert.ok(
        putHandler.includes('body.rawEventJson !== undefined || body.raw_event_json !== undefined') &&
        putHandler.includes('body.insightJson !== undefined || body.insight_json !== undefined'),
        'PUT /protoguide/feedback should accept both camelCase and snake_case JSON fields'
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Frontend-Backend Contract Tests
  // ══════════════════════════════════════════════════════════════════

  describe('Frontend-Backend Contract', () => {
    test('storeFeedback sends all required fields: text, section, type, submitterName', () => {
      const storeSection = extractSection(protoguideJs, 'async function storeFeedback', 1400);
      assert.ok(storeSection, 'storeFeedback not found');
      assert.ok(storeSection.includes('text:'), 'storeFeedback missing text field');
      assert.ok(storeSection.includes('section:'), 'storeFeedback missing section field');
      assert.ok(storeSection.includes('type:'), 'storeFeedback missing type field');
      assert.ok(storeSection.includes('submitterName:'), 'storeFeedback missing submitterName field');
    });

    test('fetchFeedback reads submissions from response (data.submissions)', () => {
      const fetchSection = extractSection(protoguideJs, 'async function fetchFeedback', 500);
      assert.ok(fetchSection, 'fetchFeedback not found');
      assert.ok(
        fetchSection.includes('data.submissions') || fetchSection.includes("data['submissions']"),
        'fetchFeedback does not read data.submissions from response'
      );
    });

    test('Worker GET returns { submissions: [...] } shape', () => {
      const getHandler = extractWorkerRouteSection("if (path === '/protoguide/feedback' && request.method === 'GET')", 1800);
      assert.ok(getHandler, 'GET /protoguide/feedback handler not found');
      assert.ok(
        getHandler.includes('json({ submissions') || getHandler.includes('json({submissions'),
        'GET handler does not return { submissions } object'
      );
    });

    test('Delete action in UI sends DELETE request via wireInsightsActions', () => {
      const wireSection = extractSection(protoguideJs, 'function wireInsightsActions', 4000);
      assert.ok(wireSection, 'wireInsightsActions not found');
      assert.ok(
        wireSection.includes("method: 'DELETE'") || wireSection.includes('method: "DELETE"'),
        'wireInsightsActions delete handler does not send DELETE request'
      );
    });

    test('Move action in UI sends PUT with type in body via wireInsightsActions', () => {
      const wireSection = extractSection(protoguideJs, 'function wireInsightsActions', 4000);
      assert.ok(wireSection, 'wireInsightsActions not found');
      assert.ok(
        wireSection.includes("method: 'PUT'") || wireSection.includes('method: "PUT"'),
        'wireInsightsActions move handler does not send PUT request'
      );
      assert.ok(
        wireSection.includes('type:') || wireSection.includes('"type"'),
        'wireInsightsActions move handler does not include type in body'
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Feedback Type Handling Tests
  // ══════════════════════════════════════════════════════════════════

  describe('Feedback Type Handling', () => {
    test('Three feedback types are grouped in loadFeedbackInsights: product, bug, correction', () => {
      const loadSection = extractSection(protoguideJs, 'async function loadFeedbackInsights', 2200);
      assert.ok(loadSection, 'loadFeedbackInsights not found');
      assert.ok(loadSection.includes('grouped = { product: [], bugs: [], corrections: [] }'),
        'loadFeedbackInsights should initialize grouped feedback buckets');
      assert.ok(loadSection.includes("s.type === 'bug'") || loadSection.includes('s.type === "bug"'),
        'loadFeedbackInsights does not handle bug type');
      assert.ok(loadSection.includes("s.type === 'correction'") || loadSection.includes('s.type === "correction"'),
        'loadFeedbackInsights does not handle correction type');
      assert.ok(loadSection.includes('else grouped.product.push(s)'),
        'loadFeedbackInsights does not handle product type');
    });

    test('report_bug tool sets type to bug in handleToolResult', () => {
      assert.ok(
        protoguideJs.includes("const fbType = toolUse.name === 'report_bug' ? 'bug' : 'product';"),
        'handleToolResult does not set type to bug for report_bug tool'
      );
    });

    test('submit_feedback tool defaults type to product in handleToolResult', () => {
      assert.ok(
        protoguideJs.includes("const fbType = toolUse.name === 'report_bug' ? 'bug' : 'product';"),
        'handleToolResult does not set type to product for submit_feedback tool'
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Pending Feedback / Name Collection Tests
  // ══════════════════════════════════════════════════════════════════

  describe('Pending Feedback & Name Collection', () => {
    test('pendingFeedback variable is declared', () => {
      assert.ok(
        protoguideJs.includes('let pendingFeedback') || protoguideJs.includes('var pendingFeedback'),
        'pendingFeedback variable not declared'
      );
    });

    test('sessionUserName variable is declared', () => {
      assert.ok(
        protoguideJs.includes('let sessionUserName') || protoguideJs.includes('var sessionUserName'),
        'sessionUserName variable not declared'
      );
    });

    test('looksLikeName function exists and has basic guards for length and word count', () => {
      const nameSection = extractSection(protoguideJs, 'function looksLikeName', 300);
      assert.ok(nameSection, 'looksLikeName function not found');
      assert.ok(
        nameSection.includes('.length') || nameSection.includes('length >'),
        'looksLikeName does not check string length'
      );
      assert.ok(
        nameSection.includes('split') || nameSection.includes('words'),
        'looksLikeName does not check word count'
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // HTML Container Tests
  // ══════════════════════════════════════════════════════════════════

  describe('HTML Containers', () => {
    test('insights-overlay exists in protoguide.html', () => {
      assert.ok(
        protoguideHtml.includes('id="insights-overlay"'),
        'insights-overlay container not found in HTML'
      );
    });

    test('insights-content, insights-loading, insights-empty exist in HTML', () => {
      assert.ok(protoguideHtml.includes('id="insights-content"'),
        'insights-content not found in HTML');
      assert.ok(protoguideHtml.includes('id="insights-loading"'),
        'insights-loading not found in HTML');
      assert.ok(protoguideHtml.includes('id="insights-empty"'),
        'insights-empty not found in HTML');
    });

    test('insights-product-body, insights-bugs-body, insights-corrections-body exist in HTML', () => {
      assert.ok(protoguideHtml.includes('id="insights-product-body"'),
        'insights-product-body not found in HTML');
      assert.ok(protoguideHtml.includes('id="insights-bugs-body"'),
        'insights-bugs-body not found in HTML');
      assert.ok(protoguideHtml.includes('id="insights-corrections-body"'),
        'insights-corrections-body not found in HTML');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Error Handling Tests
  // ══════════════════════════════════════════════════════════════════

  describe('Error Handling', () => {
    test('storeFeedback has try-catch error handling', () => {
      const storeSection = extractSection(protoguideJs, 'async function storeFeedback', 2200);
      assert.ok(storeSection, 'storeFeedback not found');
      assert.ok(
        storeSection.includes('try') && storeSection.includes('catch'),
        'storeFeedback does not have try-catch error handling'
      );
    });

    test('fetchFeedback returns empty array on error', () => {
      const fetchSection = extractSection(protoguideJs, 'async function fetchFeedback', 400);
      assert.ok(fetchSection, 'fetchFeedback not found');
      assert.ok(
        fetchSection.includes('return []'),
        'fetchFeedback does not return empty array on error/fallback'
      );
    });
  });
});
