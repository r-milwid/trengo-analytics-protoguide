import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const readFile = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

const appJs = readFile('app.js');
const widgetCatalogJs = readFile('widget-catalog.js');
const protoguideJs = readFile('protoguide/protoguide.js');
const protoguideHtml = readFile('protoguide/protoguide.html');

function extractFunctionSource(js, name) {
  const pattern = new RegExp(`function\\s+${name}\\s*\\(`);
  const match = pattern.exec(js);
  assert.ok(match, `Could not find function ${name}`);
  const start = match.index;
  const paramsStart = js.indexOf('(', start);
  let parenDepth = 0;
  let braceStart = -1;
  for (let i = paramsStart; i < js.length; i++) {
    if (js[i] === '(') parenDepth += 1;
    if (js[i] === ')') {
      parenDepth -= 1;
      if (parenDepth === 0) {
        braceStart = js.indexOf('{', i);
        break;
      }
    }
  }
  assert.notEqual(braceStart, -1, `Could not find body for function ${name}`);
  let depth = 0;
  for (let i = braceStart; i < js.length; i++) {
    if (js[i] === '{') depth += 1;
    if (js[i] === '}') {
      depth -= 1;
      if (depth === 0) return js.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
}

function extractConstSource(js, name) {
  const start = js.indexOf(`const ${name}`);
  assert.notEqual(start, -1, `Could not find const ${name}`);
  const braceStart = js.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < js.length; i++) {
    if (js[i] === '{') depth += 1;
    if (js[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        const end = js.indexOf(';', i);
        return js.slice(start, end + 1);
      }
    }
  }
  throw new Error(`Could not extract const ${name}`);
}

function loadWidgetCatalog() {
  const sandbox = { console };
  vm.createContext(sandbox);
  vm.runInContext(`${widgetCatalogJs}\nthis.__exports = { WIDGETS, WIDGET_BY_ID };`, sandbox);
  return sandbox.__exports;
}

function loadDashboardHelpers() {
  const source = [
    extractConstSource(appJs, 'DATE_FILTER_KEYS'),
    extractFunctionSource(appJs, 'cloneData'),
    extractFunctionSource(appJs, 'normalizeDateFilterKey'),
    extractFunctionSource(appJs, 'getActiveDashboardCustomerContext'),
    extractFunctionSource(appJs, 'buildDashboardQueryContext'),
    extractFunctionSource(appJs, 'buildWidgetDataCacheKey'),
    extractFunctionSource(appJs, 'collectProvenanceSources'),
    extractFunctionSource(appJs, 'summarizeProvenanceSources'),
    extractFunctionSource(appJs, 'createTargetState'),
    extractFunctionSource(appJs, 'buildDefaultProvenanceTargets'),
    extractFunctionSource(appJs, 'mergeArrayByIndex'),
    extractFunctionSource(appJs, 'mergePrimitive'),
    extractFunctionSource(appJs, 'isPlainObject'),
    extractFunctionSource(appJs, 'mergeStructuredValue'),
    extractFunctionSource(appJs, 'mergeChartLabels'),
    extractFunctionSource(appJs, 'mergeTableColumns'),
    extractFunctionSource(appJs, 'mergeWidgetPayload'),
  ].join('\n\n');

  const sandbox = {
    console,
    JSON,
    Math,
    Date,
    Set,
    state: {
      role: 'supervisor',
      personaRole: 'supervisor',
      lens: 'support',
      dateFilter: 'Last 30 days',
      teamFilter: 'All teams',
      channelFilter: new Set(['WhatsApp', 'Email']),
    },
    window: {
      AssistantStorage: { getActiveSession: () => ({ customerId: 'acme' }) },
      CustomerProfilesStore: { getById: (id) => ({ id, name: 'Acme Corp' }) },
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(`${source}\nthis.__exports = { normalizeDateFilterKey, buildDashboardQueryContext, buildWidgetDataCacheKey, mergeWidgetPayload };`, sandbox);
  return sandbox;
}

describe('Dashboard Data Contracts', () => {
  const { WIDGETS, WIDGET_BY_ID } = loadWidgetCatalog();
  const dataWidgetTypes = new Set([
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
  const dataWidgets = Object.values(WIDGETS)
    .flat()
    .filter((widget) => dataWidgetTypes.has(widget.type));

  test('every data widget has dataSpec and futureSpec', () => {
    const missing = dataWidgets
      .filter((widget) => !widget.dataSpec || !widget.futureSpec)
      .map((widget) => widget.id);
    assert.deepEqual(missing, []);
  });

  test('seeded future and mixed widgets are classified in the catalog', () => {
    assert.equal(WIDGET_BY_ID['ov-exceptions'].futureSpec.stage, 'future');
    assert.equal(WIDGET_BY_ID['op-capacity-demand'].futureSpec.stage, 'future');
    assert.equal(WIDGET_BY_ID['ov-escalation-rate'].futureSpec.stage, 'mixed');
    assert.equal(WIDGET_BY_ID['op-vc-agent-online-status'].futureSpec.stage, 'mixed');
    assert.equal(WIDGET_BY_ID['ov-open-tickets'].futureSpec.stage, 'v1');
  });
});

describe('Dashboard Query Context And Merge Helpers', () => {
  const sandbox = loadDashboardHelpers();
  const { buildDashboardQueryContext, buildWidgetDataCacheKey, mergeWidgetPayload } = sandbox.__exports;

  test('query context normalizes date range and sorts channel filters', () => {
    const context = buildDashboardQueryContext();
    assert.equal(context.customerId, 'acme');
    assert.equal(context.dateRangeKey, 'last_30_days');
    assert.deepEqual(Array.from(context.channelFilter), ['Email', 'WhatsApp']);
  });

  test('widget cache key is stable across channel selection order', () => {
    const a = buildWidgetDataCacheKey('ov-open-tickets', buildDashboardQueryContext());
    sandbox.state.channelFilter = new Set(['Email', 'WhatsApp']);
    const b = buildWidgetDataCacheKey('ov-open-tickets', buildDashboardQueryContext());
    assert.equal(a, b);
  });

  test('table payload merge falls back per field and preserves row provenance', () => {
    const merged = mergeWidgetPayload(
      'table',
      {
        columns: [{ key: 'agent', label: 'Agent' }, { key: 'assigned', label: 'Assigned' }],
        rows: [{ agent: 'Ada', assigned: 7 }],
      },
      {
        columns: [{ key: 'agent', label: 'Agent' }, { key: 'assigned', label: 'Assigned' }, { key: 'firstResponse', label: 'First response' }],
        rows: [{ agent: 'Ada', assigned: 7, firstResponse: '5m 10s' }],
      },
      'mixed'
    );

    assert.equal(merged.payload.columns.length, 3);
    assert.equal(merged.payload.columns[2].key, 'firstResponse');
    assert.equal(merged.payload.rows[0].firstResponse, '5m 10s');
    assert.equal(merged.targets.rows[0].fields.firstResponse.source, 'mock');
    assert.equal(merged.targets.rows[0].highlight, true);
  });

  test('chart payload merge falls back labels by index when API labels are incomplete', () => {
    const merged = mergeWidgetPayload(
      'bar-chart',
      {
        labels: ['Mon'],
        datasets: [{ label: 'Tickets', data: [12] }],
      },
      {
        labels: ['Mon', 'Tue'],
        datasets: [{ label: 'Tickets', data: [12, 18], backgroundColor: '#6fcdbf' }],
      },
      'mixed'
    );

    assert.deepEqual(Array.from(merged.payload.labels), ['Mon', 'Tue']);
    assert.equal(merged.targets.labels.items[1].source, 'mock');
  });

  test('chart payload merge preserves point-level provenance for fallback data', () => {
    const merged = mergeWidgetPayload(
      'bar-chart',
      {
        labels: ['Mon', 'Tue'],
        datasets: [{ label: 'Tickets', data: [12] }],
      },
      {
        labels: ['Mon', 'Tue'],
        datasets: [{ label: 'Tickets', data: [12, 18], backgroundColor: '#6fcdbf' }],
      },
      'mixed'
    );

    assert.equal(merged.payload.datasets[0].data[1], 18);
    assert.equal(merged.targets.datasets[0].points[1].source, 'mock');
    assert.equal(merged.targets.datasets[0].highlight, true);
  });
});

describe('Resolver Wiring', () => {
  test('dashboard data helpers are exposed on window', () => {
    assert.match(appJs, /window\._dashboardDataHelpers\s*=\s*\{/);
    assert.match(appJs, /resolveWidgetData/);
    assert.match(appJs, /mergeWidgetPayload/);
  });

  test('downloadWidgetCSV resolves widget data instead of scraping DOM or direct mock helpers', () => {
    const source = extractFunctionSource(appJs, 'downloadWidgetCSV');
    assert.match(source, /resolveWidgetData\(/);
    assert.doesNotMatch(source, /querySelector\(/);
    assert.doesNotMatch(source, /getMockBarData|getMockLineData|getMockDoughnutData/);
  });

  test('renderResolvedWidget handles loading, empty, and error states', () => {
    const source = extractFunctionSource(appJs, 'renderResolvedWidget');
    assert.match(source, /Loading data/);
    assert.match(source, /No data available/);
    assert.match(source, /Data unavailable/);
  });

  test('bar filter restore uses a stable chart snapshot', () => {
    const applySource = extractFunctionSource(appJs, 'applyBarFilter');
    const clearSource = extractFunctionSource(appJs, 'clearBarFilter');
    assert.match(applySource, /bf\.baseDatasets/);
    assert.match(clearSource, /bf\.baseDatasets/);
    assert.doesNotMatch(clearSource, /getCachedWidgetData/);
  });

  test('cache invalidation bumps a data revision and guards async resolver writes', () => {
    const clearSource = extractFunctionSource(appJs, 'clearWidgetDataCaches');
    const resolveSource = extractFunctionSource(appJs, 'resolveWidgetData');
    assert.match(clearSource, /state\.dataRevision \+= 1/);
    assert.match(resolveSource, /requestRevision/);
    assert.match(resolveSource, /requestRevision === state\.dataRevision/);
  });

  test('customer and team config saves invalidate resolver caches', () => {
    assert.match(extractFunctionSource(appJs, 'saveCustomerProfiles'), /clearWidgetDataCaches\(\)/);
    assert.match(extractFunctionSource(appJs, 'applySavedTeams'), /clearWidgetDataCaches\(\)/);
    assert.match(extractFunctionSource(appJs, 'applyTeamSettingsDefault'), /clearWidgetDataCaches\(\)/);
  });
});

describe('ProtoGuide Future Highlight Toggle', () => {
  test('future data control is gated behind a feature flag', () => {
    assert.match(appJs, /id:\s*'future-data-toggle'/);
  });

  test('guide panel includes the future data toggle button', () => {
    assert.match(protoguideHtml, /id="toggle-future-data-btn"/);
  });

  test('protoguide toggle button posts futureDataHighlights updates', () => {
    assert.match(protoguideJs, /toggle-future-data-btn/);
    assert.match(protoguideJs, /futureDataHighlights/);
    assert.match(protoguideJs, /guide:set-toggle/);
  });

  test('prototype guide settings data exposes futureDataHighlights', () => {
    assert.match(appJs, /futureDataHighlights:\s*Boolean\(state\.dataUI\.futureHighlightsEnabled\)/);
    assert.match(appJs, /futureDataControlVisible:\s*canUseFutureDataHighlightControl\(\)/);
  });

  test('prototype guide setToggle routes futureDataHighlights to the persisted UI toggle', () => {
    assert.match(appJs, /if \(key === 'futureDataHighlights'\)/);
    assert.match(appJs, /setFutureDataHighlightsEnabled\(checked\)/);
    assert.match(appJs, /remountSection/);
  });

  test('settings overlay includes a toggle to reveal the future data control', () => {
    assert.match(protoguideJs, /settings-future-data-control-toggle/);
    assert.match(protoguideJs, /future-data-toggle/);
    assert.match(protoguideJs, /guide:set-flag/);
  });

  test('settings row only shows the future data button when the feature flag is enabled', () => {
    const source = extractFunctionSource(protoguideJs, 'updateSettingsRow');
    assert.match(source, /futureDataControlVisible/);
    assert.match(source, /futureDataBtn\.style\.display = showFutureDataControl \? '' : 'none'/);
  });

  test('resetPrototypeStateToDefaults resets future data highlights to the default off state', () => {
    const source = extractFunctionSource(appJs, 'resetPrototypeStateToDefaults');
    assert.match(source, /FUTURE_DATA_HIGHLIGHTS_KEY/);
    assert.match(source, /futureHighlightsEnabled = false/);
  });
});
