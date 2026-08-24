# DevKit JSON and International Time Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent JSON history, collapsible JSON trees, escape/unescape actions, and full IANA-zone timestamp conversion to the existing PC-focused static toolbox.

**Architecture:** New behavior stays dependency-free. JSON transforms and IANA time conversion remain pure/testable modules; storage is isolated behind an injected Storage-like interface; `app.mjs` owns DOM rendering and never injects user HTML.

**Tech Stack:** HTML5, CSS, native ES modules, `Intl.DateTimeFormat`, `localStorage`, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-24-toolbox-enhancements-design.md`

## Global Constraints

- PC is the acceptance target; existing responsive CSS may remain but mobile polish is not required.
- History stores at most 20 successful entries under `devkit.json.history.v1`, only in browser local storage, with restore/delete/clear controls.
- No user content is uploaded or inserted via `innerHTML`.
- Support IANA zones with native `Intl`; reject invalid zones and nonexistent DST wall times.
- Preserve all existing JSON/timestamp behavior and the exact static artifact discipline.

---

### Task 1: JSON Escape and History Core

**Files:**
- Modify: `assets/js/json-core.mjs`
- Create: `assets/js/json-history.mjs`
- Modify: `tests/json-core.test.mjs`
- Create: `tests/json-history.test.mjs`
- Modify: `tests/build.test.mjs`

**Interfaces:**
- `escapeJsonText(source: string): Result`
- `unescapeJsonText(source: string): Result`
- `loadJsonHistory(storage): HistoryEntry[]`
- `saveJsonHistoryEntry(storage, entry): HistoryEntry[]`
- `deleteJsonHistoryEntry(storage, id): HistoryEntry[]`
- `clearJsonHistory(storage): []`

- [ ] Write failing tests for quotes, slashes, newlines, Unicode, optional outer quotes, malformed escapes, 20-entry truncation, deduplication, malformed stored JSON, deletion, and storage exceptions.

```js
assert.equal(escapeJsonText('a"b\nc').output, 'a\\"b\\nc');
assert.equal(unescapeJsonText('a\\"b\\nc').output, 'a"b\nc');
assert.equal(unescapeJsonText('"a\\nb"').output, 'a\nb');
assert.equal(saveJsonHistoryEntry(storage, newest).length, 20);
```

- [ ] Run focused tests and confirm failures are caused by missing exports/modules.

```bash
node --test tests/json-core.test.mjs tests/json-history.test.mjs
```

- [ ] Implement minimal transforms and injected-storage history behavior. IDs combine timestamp and a collision-safe suffix supplied by `crypto.randomUUID` when available, with a deterministic fallback.

- [ ] Update the artifact test for `assets/js/json-history.mjs`, rerun focused and full tests, then commit.

---

### Task 2: IANA Time Zone Core

**Files:**
- Modify: `assets/js/timestamp-core.mjs`
- Modify: `tests/timestamp-core.test.mjs`

**Interfaces:**
- `isValidTimeZone(zone: string): boolean`
- `formatDateInZone(milliseconds: number, zone: string): string`
- Extend `timestampToRepresentations(source, unit, nowMs, zone)` with `zoned` and `timeZone` fields.
- Extend `dateTimeToTimestamps(datePart, timePart, zone)` to accept IANA identifiers.
- `datePartsInZone(milliseconds: number, zone: string): DateParts`

- [ ] Write failing literal tests for `Asia/Shanghai`, `America/New_York`, `Europe/London`, invalid zones, and New York's nonexistent `2024-03-10 02:30:00`.

```js
assert.equal(dateTimeToTimestamps('2024-01-01', '00:00:00', 'America/New_York').milliseconds, 1704085200000);
assert.equal(dateTimeToTimestamps('2024-01-01', '00:00:00', 'Asia/Shanghai').milliseconds, 1704038400000);
assert.equal(dateTimeToTimestamps('2024-03-10', '02:30:00', 'America/New_York').ok, false);
```

- [ ] Verify RED, then implement zone validation, `formatToParts` extraction, iterative offset resolution, and strict round-trip validation. Keep `local` and `utc` compatibility.

- [ ] Run tests under both Shanghai and New York process time zones, then commit.

---

### Task 3: JSON History, Folding, and Transform UI

**Files:**
- Modify: `index.html`
- Modify: `assets/js/app.mjs`
- Modify: `assets/styles.css`
- Modify: `tests/app-copy-race.test.mjs`

**Interfaces:**
- New actions: `escape-json`, `unescape-json`, `toggle-json-tree`, `expand-json-tree`, `collapse-json-tree`, `clear-json-history`.
- History container: `#json-history-list` with buttons carrying entry IDs via `data-history-*`.
- Tree container: `#json-tree`, rendered only with `createElement` and `textContent`.

- [ ] Extend the fake-DOM test harness before production changes so missing new controls/module behavior fails.

- [ ] Implement one JSON success pipeline that updates output, status/counters, foldability, copy invalidation, and history. Failed actions do not change history.

- [ ] Render history through DOM nodes, restore inputs/outputs from entries, delete one entry, and clear all. Catch storage failures and keep the tool usable.

- [ ] Render recursive objects/arrays using `details` and `summary`; default-open depth `< 2`; implement expand/collapse all and text/tree switching.

- [ ] Add PC layout/style for a compact history rail and tree code view, run tests, and commit.

---

### Task 4: International Time Zone UI

**Files:**
- Modify: `index.html`
- Modify: `assets/js/app.mjs`
- Modify: `assets/styles.css`
- Modify: `tests/app-copy-race.test.mjs`

**Interfaces:**
- Shared select `#timezone-mode` with `local`, `utc`, and grouped IANA zone values.
- Results `#timestamp-zoned` and `#timestamp-zone-name`.

- [ ] Add failing interaction coverage for selecting an IANA zone and ensuring conversion passes it to both directions without breaking copy-error authority.

- [ ] Replace local/UTC radios with the grouped select; render selected-zone timestamp output and include it in copy text.

- [ ] Update current-time filling to use `datePartsInZone` for IANA zones, local getters for `local`, and UTC getters for `utc`.

- [ ] Verify Shanghai, New York winter/summer, London, invalid/DST error, selection persistence across route changes, and commit.

---

### Task 5: Integration, Artifact, and Deployment Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-08-24-developer-toolbox-design.md` only if its privacy statement conflicts with the new approved local-history behavior.

- [ ] Run the complete suite and deterministic build.

```bash
npm run check
TZ=America/New_York node --test tests/timestamp-core.test.mjs
```

- [ ] Serve `dist/` and verify on PC: history survives refresh and caps at 20; restore/delete/clear work; fold controls work; escape round-trip works; international zones and DST error work; no console errors or network requests appear.

- [ ] Run syntax, whitespace, tracked-artifact, privacy/API, and remote-ahead audits.

```bash
rg --files assets/js scripts tests -g '*.mjs' | sort | xargs -n 1 node --check
git diff --check
git ls-files dist node_modules .superpowers/sdd
```

- [ ] Request code review, fix all Critical/Important findings, rerun verification, commit any final fixes, and push `main` to `origin`.
