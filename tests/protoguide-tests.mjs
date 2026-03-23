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
      'settings-role-select',        // created in renderSettingsOverlay innerHTML
      'settings-anchors-toggle',     // created in renderSettingsOverlay innerHTML
      'settings-manage-teams',       // created in renderSettingsOverlay innerHTML
      'settings-reset-onboarding',   // created in renderSettingsOverlay innerHTML
      'settings-reset-all',          // created in renderSettingsOverlay innerHTML
      'settings-manage-users',       // created in renderSettingsOverlay innerHTML
      'settings-sign-out',           // created in renderSettingsOverlay innerHTML
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
  const apiMethods = [
    'getSettingsData',
    'getAdminData',
    'setRole',
    'setFlag',
    'setToggle',
    'setSlider',
    'triggerAction',
  ];

  for (const method of apiMethods) {
    test(`_prototypeGuideAPI exposes ${method}()`, () => {
      const pattern = new RegExp(`_prototypeGuideAPI\\s*=\\s*\\{[\\s\\S]*?${method}\\s*:`);
      assert.ok(pattern.test(appJs), `${method} not found in _prototypeGuideAPI object in app.js`);
    });

    test(`protoguide.js calls api.${method}`, () => {
      const pattern = new RegExp(`api\\.${method}\\(`);
      assert.ok(pattern.test(protoguideJs), `protoguide.js does not call api.${method}()`);
    });
  }

  // triggerAction must handle all actionIds used by protoguide.js
  const triggerActionIds = ['manage-teams', 'reset-onboarding', 'reset-all'];

  for (const actionId of triggerActionIds) {
    test(`triggerAction handles '${actionId}'`, () => {
      const casePattern = new RegExp(`case\\s+['"]${actionId}['"]`);
      assert.ok(casePattern.test(appJs), `triggerAction missing case for '${actionId}' in app.js`);
    });

    test(`protoguide.js sends actionId '${actionId}'`, () => {
      assert.ok(
        protoguideJs.includes(`'${actionId}'`) || protoguideJs.includes(`"${actionId}"`),
        `protoguide.js does not reference actionId '${actionId}'`
      );
    });
  }
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
    'guide:action',
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

  test('postToPrototype maps guide:action to api.triggerAction', () => {
    assert.ok(protoguideJs.includes("'guide:action'") && protoguideJs.includes('api.triggerAction'));
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
    // Look for JSON.stringify({ system, messages, tools })
    assert.ok(
      protoguideJs.includes('JSON.stringify({ system, messages, tools })') ||
      protoguideJs.includes('JSON.stringify({system, messages, tools})'),
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

  const settingsElementIds = [
    'settings-role-select',
    'settings-anchors-toggle',
    'settings-manage-teams',
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
    // Count occurrences of getAuthHeaders() in the manage users section
    const manageSection = protoguideJs.substring(
      protoguideJs.indexOf('openManageUsersModal'),
      protoguideJs.indexOf('openManageUsersModal') + 3000
    );
    const authCount = (manageSection.match(/getAuthHeaders\(\)/g) || []).length;
    assert.ok(authCount >= 2, `Expected >= 2 getAuthHeaders() calls in manage users, found ${authCount}`);
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
    { name: 'authFetch references', pattern: /\bauthFetch\b/ },
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
// 12. No SideCar References Tests
// ════════════════════════════════════════════════════════════════════════════

describe('12. No SideCar References', () => {
  const zeroSidecarFiles = [
    { name: 'protoguide/protoguide.html', content: protoguideHtml },
    { name: 'protoguide/protoguide-login.html', content: loginHtml },
    { name: 'chatbot-proxy/worker.js', content: workerJs },
  ];

  // Include login CSS if it exists
  if (loginCss) {
    zeroSidecarFiles.push({ name: 'protoguide/protoguide-login.css', content: loginCss });
  }

  for (const { name, content } of zeroSidecarFiles) {
    test(`${name} has zero "sidecar" references (case-insensitive)`, () => {
      const matches = content.match(/sidecar/gi) || [];
      assert.strictEqual(matches.length, 0,
        `Found ${matches.length} "sidecar" reference(s) in ${name}`);
    });
  }

  test('protoguide.js has at most 3 historical sidecar references (in comments)', () => {
    const matches = protoguideJs.match(/sidecar/gi) || [];
    assert.ok(matches.length <= 3,
      `Found ${matches.length} sidecar references in protoguide.js, expected <= 3`);

    // Verify all references are in comments (contain "original sidecar" or "original SideCar")
    const lines = protoguideJs.split('\n');
    const sidecarLines = lines.filter(l => /sidecar/i.test(l));
    for (const line of sidecarLines) {
      const trimmed = line.trim();
      assert.ok(
        trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*'),
        `Non-comment sidecar reference found: "${trimmed.substring(0, 80)}"`
      );
    }
  });
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
      protoguideJs.indexOf('async function storeFeedback') + 500
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
