# Developer Toolbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hexo blog with a polished static developer toolbox containing a JSON formatter and a bidirectional timestamp converter.

**Architecture:** A framework-free static application lives at the repository root and is published from a generated `dist/` directory. Domain behavior is implemented as DOM-free ES modules tested with Node's built-in test runner; a single browser entry module owns routing, event binding, rendering, copy feedback, and the visibility-aware clock.

**Tech Stack:** Semantic HTML5, modern CSS, native ES modules, Node.js 20 built-in test runner, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-24-developer-toolbox-design.md`

## Global Constraints

- Provide exactly two tools in v1: JSON formatting and timestamp conversion.
- All user data stays in the browser; do not add network requests, analytics, cookies, or persistent storage.
- Use no client-side framework, server, external font, or image dependency.
- Support current Chrome, Edge, Firefox, and Safari releases.
- Support keyboard navigation, visible focus, `aria-live` status, non-color status labels, and `prefers-reduced-motion`.
- Preserve inputs when switching tools and select the initial tool from `#json` or `#timestamp`, falling back to JSON.
- Publish only the built static site, never tests, docs, or legacy Hexo files.

---

## Planned File Structure

```text
.
├── .github/workflows/deploy.yml     # test, build, and GitHub Pages deployment
├── .gitignore                       # ignores generated dist directory
├── .nojekyll                        # disables Jekyll processing in the artifact
├── index.html                       # complete semantic application shell
├── package.json                     # dependency-free test/build scripts
├── assets/
│   ├── favicon.svg                  # local vector favicon
│   ├── styles.css                   # design tokens, layout, states, responsive rules
│   └── js/
│       ├── app.mjs                  # routing, DOM events, rendering, clock, clipboard
│       ├── json-core.mjs            # pure JSON parse/format/minify operations
│       ├── router-core.mjs          # pure URL hash normalization
│       └── timestamp-core.mjs       # pure timestamp/date conversion operations
├── scripts/build.mjs                # creates a minimal dist artifact
└── tests/
    ├── json-core.test.mjs
    ├── router-core.test.mjs
    └── timestamp-core.test.mjs
```

Legacy Hexo configuration, sources, themes, generated database, lockfile, and obsolete planning documents remain tracked until the final migration task, then are removed after the static app passes verification.

---

### Task 1: JSON Domain Module

**Files:**
- Create: `assets/js/json-core.mjs`
- Create: `tests/json-core.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `formatJson(source: string, indent: 2 | 4 | "tab"): { ok: true, output: string } | { ok: false, error: string, position: number | null }`
- Produces: `minifyJson(source: string): { ok: true, output: string } | { ok: false, error: string, position: number | null }`
- Produces: `JSON_EMPTY_ERROR: string`

- [ ] **Step 1: Replace package metadata with dependency-free scripts**

```json
{
  "name": "developer-toolbox",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "build": "node scripts/build.mjs",
    "check": "npm test && npm run build"
  }
}
```

- [ ] **Step 2: Write JSON behavior tests**

Create `tests/json-core.test.mjs` with tests that assert:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatJson, minifyJson, JSON_EMPTY_ERROR } from '../assets/js/json-core.mjs';

test('formats nested JSON with the selected indentation', () => {
  assert.equal(formatJson('{"tool":{"name":"JSON","ready":true}}', 2).output,
    '{\n  "tool": {\n    "name": "JSON",\n    "ready": true\n  }\n}');
  assert.match(formatJson('{"a":1}', 4).output, /\n    "a"/);
  assert.match(formatJson('{"a":1}', 'tab').output, /\n\t"a"/);
});

test('supports every valid JSON root type and unicode', () => {
  for (const value of ['null', '42', 'true', '"你好"', '[1,2]']) {
    assert.equal(formatJson(value, 2).ok, true);
  }
});

test('minifies valid JSON', () => {
  assert.deepEqual(minifyJson('{\n  "a": 1,\n  "b": [true, null]\n}'),
    { ok: true, output: '{"a":1,"b":[true,null]}' });
});

test('returns a stable empty-input error', () => {
  assert.deepEqual(formatJson('   ', 2), { ok: false, error: JSON_EMPTY_ERROR, position: null });
});

test('returns readable parse errors without changing the input', () => {
  const result = formatJson('{"a":}', 2);
  assert.equal(result.ok, false);
  assert.match(result.error, /JSON|位置|字符|unexpected|property/i);
  assert.equal(result.position === null || Number.isInteger(result.position), true);
});
```

- [ ] **Step 3: Run the JSON tests and verify they fail**

Run: `node --test tests/json-core.test.mjs`  
Expected: FAIL because `assets/js/json-core.mjs` does not exist.

- [ ] **Step 4: Implement the JSON module**

Implement one private `transformJson(source, indent)` function. It must trim only for the empty check, parse the original source with `JSON.parse`, serialize using `JSON.stringify`, convert `"tab"` to `"\t"`, and catch `SyntaxError`. Extract a numeric character position with a tolerant regex such as `/(?:position|字符)\s*(\d+)/i`; otherwise return `null`. Export the interfaces above and use the Chinese empty message `请输入需要处理的 JSON 内容。`.

```js
export const JSON_EMPTY_ERROR = '请输入需要处理的 JSON 内容。';

function transformJson(source, indent) {
  if (!source.trim()) return { ok: false, error: JSON_EMPTY_ERROR, position: null };
  try {
    return { ok: true, output: JSON.stringify(JSON.parse(source), null, indent) };
  } catch (error) {
    const match = error.message.match(/(?:position|字符)\s*(\d+)/i);
    return { ok: false, error: `JSON 解析失败：${error.message}`, position: match ? Number(match[1]) : null };
  }
}

export const formatJson = (source, indent = 2) =>
  transformJson(source, indent === 'tab' ? '\t' : Number(indent));
export const minifyJson = source => transformJson(source, 0);
```

- [ ] **Step 5: Run the focused and full test commands**

Run: `node --test tests/json-core.test.mjs`  
Expected: 5 passing tests.

Run: `npm test`  
Expected: all discovered tests pass.

- [ ] **Step 6: Commit the JSON module**

```bash
git add package.json assets/js/json-core.mjs tests/json-core.test.mjs
git commit -m "feat: add tested JSON transformations"
```

---

### Task 2: Timestamp Domain Module

**Files:**
- Create: `assets/js/timestamp-core.mjs`
- Create: `tests/timestamp-core.test.mjs`

**Interfaces:**
- Produces: `normalizeTimestamp(source: string, unit: "auto" | "seconds" | "milliseconds"): { ok: true, milliseconds: number, detectedUnit: "seconds" | "milliseconds" } | { ok: false, error: string }`
- Produces: `timestampToRepresentations(source: string, unit: "auto" | "seconds" | "milliseconds", nowMs?: number): { ok: true, milliseconds: number, detectedUnit: string, local: string, utc: string, iso: string, relative: string } | { ok: false, error: string }`
- Produces: `dateTimeToTimestamps(datePart: string, timePart: string, zone: "local" | "utc"): { ok: true, seconds: number, milliseconds: number, iso: string } | { ok: false, error: string }`
- Produces: `formatRelative(targetMs: number, nowMs?: number): string`

- [ ] **Step 1: Write timestamp conversion tests**

Create `tests/timestamp-core.test.mjs` with deterministic assertions:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTimestamp,
  timestampToRepresentations,
  dateTimeToTimestamps,
  formatRelative
} from '../assets/js/timestamp-core.mjs';

test('auto-detects seconds and milliseconds by magnitude', () => {
  assert.deepEqual(normalizeTimestamp('1710000000', 'auto'), {
    ok: true, milliseconds: 1710000000000, detectedUnit: 'seconds'
  });
  assert.deepEqual(normalizeTimestamp('1710000000000', 'auto'), {
    ok: true, milliseconds: 1710000000000, detectedUnit: 'milliseconds'
  });
});

test('accepts zero, negative timestamps, and explicit units', () => {
  assert.equal(normalizeTimestamp('0', 'seconds').milliseconds, 0);
  assert.equal(normalizeTimestamp('-1', 'seconds').milliseconds, -1000);
  assert.equal(normalizeTimestamp('1000', 'milliseconds').milliseconds, 1000);
});

test('produces stable UTC and ISO representations', () => {
  const result = timestampToRepresentations('0', 'seconds', 0);
  assert.equal(result.iso, '1970-01-01T00:00:00.000Z');
  assert.match(result.utc, /1970/);
  assert.equal(result.relative, '现在');
});

test('converts UTC date fields to seconds and milliseconds', () => {
  assert.deepEqual(dateTimeToTimestamps('1970-01-01', '00:00:01', 'utc'), {
    ok: true,
    seconds: 1,
    milliseconds: 1000,
    iso: '1970-01-01T00:00:01.000Z'
  });
});

test('formats past and future relative values', () => {
  assert.equal(formatRelative(60_000, 0), '1 分钟后');
  assert.equal(formatRelative(-7_200_000, 0), '2 小时前');
});

test('rejects blank, non-finite, malformed, and out-of-range values', () => {
  for (const value of ['', 'abc', 'Infinity', '1e100']) {
    assert.equal(normalizeTimestamp(value, 'auto').ok, false);
  }
  assert.equal(dateTimeToTimestamps('', '12:00:00', 'utc').ok, false);
  assert.equal(dateTimeToTimestamps('2026-02-30', '12:00:00', 'utc').ok, false);
});
```

- [ ] **Step 2: Run timestamp tests and verify they fail**

Run: `node --test tests/timestamp-core.test.mjs`  
Expected: FAIL because `assets/js/timestamp-core.mjs` does not exist.

- [ ] **Step 3: Implement timestamp normalization**

Parse only trimmed decimal strings matching `/^-?\d+(?:\.\d+)?$/`. For auto mode, treat absolute values below `1e11` as seconds and other values as milliseconds. Reject non-finite results and values outside the JavaScript `Date` range by checking `Number.isNaN(new Date(milliseconds).getTime())`.

```js
export function normalizeTimestamp(source, unit = 'auto') {
  const text = source.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return failure('请输入有效的数字时间戳。');
  const numeric = Number(text);
  const detectedUnit = unit === 'auto'
    ? (Math.abs(numeric) < 1e11 ? 'seconds' : 'milliseconds')
    : unit;
  const milliseconds = detectedUnit === 'seconds' ? numeric * 1000 : numeric;
  if (!Number.isFinite(milliseconds) || Number.isNaN(new Date(milliseconds).getTime())) {
    return failure('时间戳超出可转换范围。');
  }
  return { ok: true, milliseconds, detectedUnit };
}
```

- [ ] **Step 4: Implement representations and strict date conversion**

Use `Intl.DateTimeFormat` for local output, `toUTCString()` for UTC, and `toISOString()` for ISO. Build UTC values with `Date.UTC`; build local values with the multi-argument `new Date(year, monthIndex, day, hour, minute, second)`. Round-trip every date component to reject rollover dates such as February 30. Generate relative Chinese strings using the largest appropriate unit among year, month, day, hour, minute, and second; use `现在` when the rounded difference is zero.

```js
export function dateTimeToTimestamps(datePart, timePart, zone = 'local') {
  const dateMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timePart.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!dateMatch || !timeMatch) return failure('请选择完整且有效的日期与时间。');
  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hour, minute, second = 0] = timeMatch.slice(1).map(Number);
  const milliseconds = zone === 'utc'
    ? Date.UTC(year, month - 1, day, hour, minute, second)
    : new Date(year, month - 1, day, hour, minute, second).getTime();
  const check = new Date(milliseconds);
  const parts = zone === 'utc'
    ? [check.getUTCFullYear(), check.getUTCMonth() + 1, check.getUTCDate(), check.getUTCHours(), check.getUTCMinutes(), check.getUTCSeconds()]
    : [check.getFullYear(), check.getMonth() + 1, check.getDate(), check.getHours(), check.getMinutes(), check.getSeconds()];
  if ([year, month, day, hour, minute, second].some((value, index) => value !== parts[index])) {
    return failure('日期或时间不存在，请检查输入。');
  }
  return { ok: true, seconds: Math.floor(milliseconds / 1000), milliseconds, iso: check.toISOString() };
}

const RELATIVE_UNITS = [
  ['年', 31_536_000_000], ['个月', 2_592_000_000], ['天', 86_400_000],
  ['小时', 3_600_000], ['分钟', 60_000], ['秒', 1_000]
];
const failure = error => ({ ok: false, error });

export function formatRelative(targetMs, nowMs = Date.now()) {
  const difference = targetMs - nowMs;
  for (const [label, size] of RELATIVE_UNITS) {
    if (Math.abs(difference) >= size) {
      const amount = Math.round(Math.abs(difference) / size);
      return `${amount} ${label}${difference < 0 ? '前' : '后'}`;
    }
  }
  return '现在';
}

export function timestampToRepresentations(source, unit = 'auto', nowMs = Date.now()) {
  const normalized = normalizeTimestamp(source, unit);
  if (!normalized.ok) return normalized;
  const date = new Date(normalized.milliseconds);
  return {
    ...normalized,
    local: new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full', timeStyle: 'medium' }).format(date),
    utc: date.toUTCString(),
    iso: date.toISOString(),
    relative: formatRelative(normalized.milliseconds, nowMs)
  };
}
```

- [ ] **Step 5: Run focused and complete tests**

Run: `node --test tests/timestamp-core.test.mjs`  
Expected: 6 passing tests.

Run: `npm test`  
Expected: JSON and timestamp suites pass.

- [ ] **Step 6: Commit the timestamp module**

```bash
git add assets/js/timestamp-core.mjs tests/timestamp-core.test.mjs
git commit -m "feat: add tested timestamp conversions"
```

---

### Task 3: Tool Routing and Semantic Application Shell

**Files:**
- Create: `assets/js/router-core.mjs`
- Create: `tests/router-core.test.mjs`
- Create: `index.html`
- Create: `assets/favicon.svg`

**Interfaces:**
- Produces: `normalizeToolHash(hash: string): "json" | "timestamp"`
- Produces DOM hooks consumed by Task 4: `[data-tool-link]`, `[data-tool-panel]`, `[data-action]`, `#json-input`, `#json-output`, `#timestamp-input`, `#date-input`, `#time-input`, `#timezone-mode`, and associated status/result elements.

- [ ] **Step 1: Write routing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToolHash } from '../assets/js/router-core.mjs';

test('accepts the two known tools', () => {
  assert.equal(normalizeToolHash('#json'), 'json');
  assert.equal(normalizeToolHash('#timestamp'), 'timestamp');
});

test('falls back to JSON for empty or unknown hashes', () => {
  assert.equal(normalizeToolHash(''), 'json');
  assert.equal(normalizeToolHash('#other'), 'json');
});
```

- [ ] **Step 2: Run the routing test and verify it fails**

Run: `node --test tests/router-core.test.mjs`  
Expected: FAIL because the router module does not exist.

- [ ] **Step 3: Implement the routing function and verify it passes**

Implement `normalizeToolHash` by removing the leading `#`, lowercasing the value, and returning it only when it equals `json` or `timestamp`.

```js
export function normalizeToolHash(hash = '') {
  const tool = hash.replace(/^#/, '').toLowerCase();
  return tool === 'timestamp' ? 'timestamp' : 'json';
}
```

Run: `node --test tests/router-core.test.mjs`  
Expected: 2 passing tests.

- [ ] **Step 4: Create the semantic page shell**

Create `index.html` with:

- Chinese metadata, canonical title `DevKit — 在线开发工具箱`, description, theme color, favicon, and local Open Graph tags.
- A skip link, sidebar/header brand, two actual anchor links (`#json`, `#timestamp`), privacy note, and compact footer.
- A `main` region containing two labelled tool sections. Only inactive sections receive the `hidden` attribute.
- JSON input/output textareas, indent select, example/format/minify/copy/clear buttons, counters, and an `aria-live="polite"` status.
- Timestamp current-time display; timestamp input plus auto/seconds/milliseconds select; local, UTC, ISO, and relative output rows; date, time, and local/UTC controls; current-time, convert, copy, and clear actions; nearby `aria-live` errors.
- Button text and labels that make every action understandable without relying on icons.
- `<noscript>` explaining that local JavaScript is required.
- `<script type="module" src="./assets/js/app.mjs"></script>` at the end of the body.

Use inline SVG only for small interface marks. Do not include remote URLs, external fonts, analytics, or third-party scripts.

- [ ] **Step 5: Create the local favicon**

Create `assets/favicon.svg` as a compact dark rounded square containing a lime `>_` terminal mark. Include `role="img"` and an accessible `<title>`.

- [ ] **Step 6: Run tests and inspect the static shell**

Run: `npm test`  
Expected: all three suites pass.

Run: `rg -n "https?://|<script" index.html`  
Expected: only the local module script is present and no remote asset URL appears.

- [ ] **Step 7: Commit routing and markup**

```bash
git add index.html assets/favicon.svg assets/js/router-core.mjs tests/router-core.test.mjs
git commit -m "feat: add semantic toolbox shell"
```

---

### Task 4: Browser Interaction and Rendering

**Files:**
- Create: `assets/js/app.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: all exports from `json-core.mjs`, `timestamp-core.mjs`, and `router-core.mjs`.
- Consumes: DOM hooks defined in Task 3.
- Produces: hash-based tool switching, JSON actions, timestamp actions, clipboard feedback, live clock, counters, and preserved in-memory inputs.

- [ ] **Step 1: Add a browser smoke-test harness to the markup**

Add stable attributes to every interactive control (`data-action="format-json"`, `data-action="minify-json"`, `data-action="convert-timestamp"`, `data-action="convert-date"`, and copy/clear/current/example equivalents). Add `data-status="idle|success|error"` targets so success and error states include visible text, not only color.

- [ ] **Step 2: Implement tool routing and navigation**

In `app.mjs`, call `normalizeToolHash(location.hash)` at startup and on `hashchange`. For each tool link, set `aria-current="page"` only on the active link; toggle `hidden` on panels; update the document title to include the active tool; normalize unknown hashes with `history.replaceState(null, '', '#json')` without a page reload. Do not clear either panel's form values while switching.

```js
function renderRoute() {
  const tool = normalizeToolHash(location.hash);
  if (location.hash !== `#${tool}`) history.replaceState(null, '', `#${tool}`);
  document.querySelectorAll('[data-tool-link]').forEach(link => {
    const active = link.dataset.toolLink === tool;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-tool-panel]').forEach(panel => {
    panel.hidden = panel.dataset.toolPanel !== tool;
  });
  document.title = `${tool === 'json' ? 'JSON 格式化' : '时间戳转换'} — DevKit`;
}
window.addEventListener('hashchange', renderRoute);
renderRoute();
```

- [ ] **Step 3: Implement JSON UI actions**

Bind the example, format, minify, copy, and clear buttons. Call only the domain functions for transformations. On success, update output, counters, status text, and state attribute. On error, leave the input unchanged, clear stale output, show the returned message plus a one-based character location when present, and focus the input. Use a short realistic nested Chinese example containing strings, booleans, an array, and a nested object.

```js
function runJson(mode) {
  const result = mode === 'minify'
    ? minifyJson(jsonInput.value)
    : formatJson(jsonInput.value, indentSelect.value);
  if (!result.ok) {
    jsonOutput.value = '';
    setStatus(jsonStatus, 'error', `${result.error}${result.position === null ? '' : `（字符 ${result.position + 1}）`}`);
    jsonInput.focus();
    updateJsonCounters();
    return;
  }
  jsonOutput.value = result.output;
  setStatus(jsonStatus, 'success', mode === 'minify' ? '已压缩为单行 JSON' : 'JSON 格式正确，已完成格式化');
  updateJsonCounters();
}
```

- [ ] **Step 4: Implement timestamp UI actions**

Bind timestamp conversion, date conversion, current-time, copy, and clear actions. Render detected unit, local, UTC, ISO, and relative results. When filling current time, populate timestamp milliseconds plus local date/time fields. Preserve the user's explicit unit and zone selections. On conversion failure, clear stale result fields, display the domain error beside the originating input, and retain the input.

```js
function convertTimestamp() {
  const result = timestampToRepresentations(timestampInput.value, timestampUnit.value);
  if (!result.ok) return renderTimestampError(result.error);
  timestampResults.local.textContent = result.local;
  timestampResults.utc.textContent = result.utc;
  timestampResults.iso.textContent = result.iso;
  timestampResults.relative.textContent = result.relative;
  detectedUnit.textContent = result.detectedUnit === 'seconds' ? '秒级' : '毫秒级';
  setStatus(timestampStatus, 'success', '转换完成');
}
```

- [ ] **Step 5: Implement clipboard and clock behavior**

Create `copyText(value, trigger)` using `navigator.clipboard.writeText` when available and a temporary selected textarea fallback otherwise. Return visible success/failure status and restore the button label after 1.6 seconds. Start the current-time interval only when `document.visibilityState === 'visible'`; clear it while hidden; immediately refresh when visibility returns. Render the local zone name from `Intl.DateTimeFormat().resolvedOptions().timeZone`.

```js
async function copyText(value, trigger) {
  const original = trigger.textContent;
  try {
    if (!value) throw new Error('empty');
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else fallbackCopy(value);
    trigger.textContent = '已复制';
  } catch {
    trigger.textContent = '复制失败';
  }
  window.setTimeout(() => { trigger.textContent = original; }, 1600);
}

function syncClock() {
  clearInterval(clockTimer);
  if (document.visibilityState !== 'visible') return;
  renderCurrentTime();
  clockTimer = window.setInterval(renderCurrentTime, 1000);
}
document.addEventListener('visibilitychange', syncClock);
```

- [ ] **Step 6: Serve and exercise the interactions manually**

Run: `python3 -m http.server 4173`  
Expected: the page loads at `http://localhost:4173`, both hash routes work without reload, JSON format/minify/error flows behave correctly, timestamp conversions round-trip, copy feedback appears, and switching tools preserves inputs.

- [ ] **Step 7: Run automated regression tests**

Run: `npm test`  
Expected: all domain and routing tests pass.

- [ ] **Step 8: Commit browser behavior**

```bash
git add index.html assets/js/app.mjs
git commit -m "feat: wire toolbox interactions"
```

---

### Task 5: Responsive Visual System and Accessibility States

**Files:**
- Create: `assets/styles.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: semantic structure and `data-status` attributes from Tasks 3–4.
- Produces: desktop sidebar, mobile tool switcher, instrument-panel visual language, responsive editor/results layout, visible interaction states.

- [ ] **Step 1: Define the visual tokens and global foundation**

In `:root`, define explicit variables for ink (`#101411`), deep panel (`#171c18`), paper (`#f3f0e7`), paper-muted (`#e6e2d7`), lime (`#b8f34a`), coral (`#e46f61`), borders, text, radii, shadows, and mono/system font stacks. Apply `box-sizing`, antialiasing, selection color, grid-texture background, a visible skip-link treatment, and a centered application frame.

```css
:root {
  --ink: #101411;
  --panel: #171c18;
  --paper: #f3f0e7;
  --paper-muted: #e6e2d7;
  --lime: #b8f34a;
  --coral: #e46f61;
  --line-dark: rgba(255, 255, 255, .12);
  --line-paper: rgba(16, 20, 17, .16);
  --radius: 18px;
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
*, *::before, *::after { box-sizing: border-box; }
:focus-visible { outline: 3px solid var(--lime); outline-offset: 3px; }
```

- [ ] **Step 2: Build desktop layout and component styles**

At widths above 960px, use a 260–290px dark fixed-width sidebar and flexible paper workspace. Style numbered navigation rows, the privacy callout, title eyebrow, control bars, textarea/editor wells, status chips, result rows, input groups, and primary/secondary/ghost buttons. Use borders and measured spacing for hierarchy; reserve lime for active/focus/primary/success emphasis.

- [ ] **Step 3: Add responsive rules**

- At `max-width: 960px`, stack navigation above content and turn tool links into a two-column switcher.
- At `max-width: 720px`, stack JSON editors and timestamp cards, allow control bars to wrap, and make important buttons at least 44px high.
- At `max-width: 420px`, reduce page gutters and heading size while preserving textarea height and preventing result labels from colliding with values.
- Add `min-width: 0`, overflow wrapping, and textarea resize constraints wherever necessary to prevent horizontal scrolling.

```css
@media (max-width: 960px) {
  .app-shell { grid-template-columns: 1fr; }
  .tool-nav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .editor-grid, .timestamp-grid { grid-template-columns: 1fr; }
  button, .button { min-height: 44px; }
}
@media (max-width: 420px) {
  .workspace { padding-inline: 16px; }
  .page-title { font-size: clamp(2rem, 11vw, 3rem); }
}
```

- [ ] **Step 4: Add interaction, error, and motion-accessibility states**

Style `:hover`, `:focus-visible`, `[aria-current="page"]`, disabled controls, `[data-status="success"]`, and `[data-status="error"]`. Add only short opacity/transform transitions, then disable animation and smooth scrolling inside `@media (prefers-reduced-motion: reduce)`.

```css
[aria-current="page"] { color: var(--ink); background: var(--lime); }
[data-status="success"] { color: #315200; }
[data-status="error"] { color: #8d2d24; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 5: Verify at target viewports**

Use browser screenshots at approximately 1440×1000, 768×1024, and 390×844. Check both tools at each width, including JSON parse error and populated timestamp results. Confirm no horizontal overflow, clipped copy buttons, unreadable contrast, hidden focus, or overlapping labels.

- [ ] **Step 6: Verify keyboard and reduced-motion behavior**

Tab from the skip link through navigation and each tool action; confirm logical order and visible focus. Enable reduced motion and confirm transitions/animations are suppressed. Confirm screen-reader statuses have meaningful text after success and failure.

- [ ] **Step 7: Commit the visual system**

```bash
git add index.html assets/styles.css
git commit -m "feat: add responsive toolbox visual system"
```

---

### Task 6: Static Build, Deployment Migration, and Legacy Cleanup

**Files:**
- Create: `.nojekyll`
- Create: `.gitignore`
- Create: `scripts/build.mjs`
- Modify: `.github/workflows/deploy.yml`
- Delete: `_config.yml`
- Delete: `_config.butterfly.yml`
- Delete: `db.json`
- Delete: `package-lock.json`
- Delete: `scaffolds/`
- Delete: `source/`
- Delete: `themes/`
- Delete: `docs/superpowers/plans/2026-04-13-personal-blog.md`
- Delete: `docs/superpowers/specs/2026-04-13-personal-blog-design.md`

**Interfaces:**
- Consumes: `index.html`, `assets/`, and `.nojekyll`.
- Produces: a clean `dist/` containing only deployable files.

- [ ] **Step 1: Implement the deterministic build script**

Create `scripts/build.mjs` using `node:fs/promises`. Resolve paths from `import.meta.url`; remove only the repository-local `dist/`; recreate it; copy `index.html`, `.nojekyll`, and the complete `assets/` directory. Assert that `dist/index.html`, `dist/assets/styles.css`, and `dist/assets/js/app.mjs` exist before logging success.

```js
import { access, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist);
await cp(path.join(root, 'index.html'), path.join(dist, 'index.html'));
await cp(path.join(root, '.nojekyll'), path.join(dist, '.nojekyll'));
await cp(path.join(root, 'assets'), path.join(dist, 'assets'), { recursive: true });
await Promise.all(['index.html', 'assets/styles.css', 'assets/js/app.mjs']
  .map(file => access(path.join(dist, file))));
console.log('Static site built in dist/');
```

- [ ] **Step 2: Add deployment metadata and ignore generated output**

Create an empty `.nojekyll`. Add only these generated/local entries to `.gitignore`:

```gitignore
dist/
.DS_Store
```

- [ ] **Step 3: Rewrite the GitHub Pages workflow**

Keep the current `main` and manual triggers, Pages permissions, concurrency, and deploy job. In the build job, use Node.js 20, run `npm test`, run `npm run build`, and upload `./dist` with `actions/upload-pages-artifact@v3`. Remove `npm ci`, global Hexo installation, and Hexo generation commands.

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
- name: Test
  run: npm test
- name: Build static site
  run: npm run build
- name: Upload Pages artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./dist
```

- [ ] **Step 4: Build and inspect the artifact**

Run: `npm run build`  
Expected: success and a new `dist/`.

Run: `find dist -type f | sort`  
Expected: only `.nojekyll`, `index.html`, `assets/favicon.svg`, `assets/styles.css`, and the four JavaScript modules.

Run: `test ! -e dist/docs && test ! -e dist/tests && test ! -e dist/source`  
Expected: exit status 0.

- [ ] **Step 5: Remove the obsolete Hexo implementation**

Delete only the tracked legacy paths listed in this task. Do not remove the new design/implementation documents, `.git`, `.github`, root static application, tests, or build script. Confirm the removed files remain recoverable from Git history.

- [ ] **Step 6: Run the full verification suite from a clean artifact**

Run: `npm run check`  
Expected: all tests pass and `dist/` is rebuilt successfully.

Run: `git diff --check`  
Expected: no whitespace errors.

Run: `rg -n "hexo|butterfly|fred's Blog|Backend Engineer" index.html assets package.json .github/workflows/deploy.yml scripts tests`  
Expected: no matches.

- [ ] **Step 7: Perform final browser verification against the artifact**

Run: `python3 -m http.server 4173 --directory dist`  
Expected: the exact deployable artifact works at `http://localhost:4173`; repeat JSON success/error, timestamp round-trip, route refresh, mobile viewport, and keyboard checks.

- [ ] **Step 8: Commit the deployment migration**

```bash
git add -A
git commit -m "build: migrate GitHub Pages to static toolbox"
```

---

## Final Acceptance Checklist

- [ ] `npm run check` succeeds from the repository root.
- [ ] JSON formatting supports 2 spaces, 4 spaces, tabs, minification, primitive roots, Unicode, copy, clear, example data, counters, and readable errors.
- [ ] Timestamp conversion supports seconds/milliseconds auto-detection, explicit units, negative/zero values, local/UTC/ISO/relative output, local/UTC date interpretation, copy, clear, and current time.
- [ ] `#json`, `#timestamp`, and unknown hash fallback work without clearing either tool's input.
- [ ] Desktop, tablet, and phone layouts have no horizontal overflow.
- [ ] Keyboard focus, skip link, live regions, visible status text, and reduced-motion behavior are verified.
- [ ] `dist/` contains only deployable static assets.
- [ ] The GitHub workflow tests before deploying `dist/`.
- [ ] Legacy Hexo files are removed from the working tree and remain recoverable through Git history.
