import test from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(document, { textContent = '', value = '', tagName = 'div' } = {}) {
    this.document = document;
    this.tagName = tagName.toUpperCase();
    this._textContent = textContent;
    this.textWrites = 0;
    this.value = value;
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this.attributes = new Map();
    this.checked = false;
    this.hidden = false;
    this.disabled = false;
    this.open = false;
    this.className = '';
    this.classList = {
      add: (...names) => {
        const current = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach(name => current.add(name));
        this.className = [...current].join(' ');
      },
      remove: (...names) => {
        const removed = new Set(names);
        this.className = this.className.split(/\s+/).filter(name => name && !removed.has(name)).join(' ');
      },
      toggle: (name, force) => {
        const present = this.className.split(/\s+/).includes(name);
        const add = force === undefined ? !present : force;
        this.classList[add ? 'add' : 'remove'](name);
        return add;
      }
    };
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = value;
    this.textWrites += 1;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  async dispatch(type, target = this) {
    const event = { currentTarget: this, target };
    const results = (this.listeners.get(type) || []).map(listener => listener(event));
    await Promise.all(results);
  }

  append(...children) {
    children.forEach(child => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  replaceChildren(...children) {
    this.children.forEach(child => { child.parentElement = null; });
    this.children = [];
    this.append(...children);
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = node => {
      node.children.forEach(child => {
        if (selector === 'details' && child.tagName === 'DETAILS') matches.push(child);
        visit(child);
      });
    };
    visit(this);
    return matches;
  }

  focus() {
    this.document.activeElement = this;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  select() {}
  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(child => child !== this);
    this.parentElement = null;
  }
}

class FakeStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function createHarness() {
  const elements = new Map();
  const actions = new Map();
  const documentListeners = new Map();
  const timers = new Map();
  const timerCallbacks = new Map();
  let nextTimer = 1;

  const document = {
    activeElement: null,
    visibilityState: 'visible',
    body: { append() {} },
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    createElement(tagName) { return new FakeElement(document, { tagName }); },
    querySelector(selector) {
      if (selector.startsWith('#')) return elements.get(selector.slice(1));
      const actionMatch = selector.match(/^\[data-action="(.+)"\]$/);
      if (actionMatch) return actions.get(actionMatch[1]);
      if (selector === 'input[name="timezone-mode"]:checked') return elements.get('timezone-mode');
      return null;
    },
    querySelectorAll() { return []; }
  };

  const addElement = (id, options) => {
    const element = new FakeElement(document, options);
    elements.set(id, element);
    return element;
  };
  const addAction = (name, label) => {
    const element = addElement(`action-${name}`, { textContent: label });
    element.dataset.action = name;
    actions.set(name, element);
    return element;
  };

  for (const id of [
    'json-input', 'json-output', 'json-input-count', 'json-output-count', 'json-status',
    'json-tree', 'json-history-list', 'json-history-empty',
    'timestamp-input', 'timestamp-error', 'date-input', 'time-input', 'date-error',
    'current-time', 'local-zone', 'timestamp-detected-unit', 'timestamp-local',
    'timestamp-utc', 'timestamp-iso', 'timestamp-relative', 'date-seconds',
    'date-milliseconds', 'date-iso'
  ]) addElement(id);
  addElement('json-indent', { value: '2' });
  addElement('timestamp-unit', { value: 'auto' });
  const timezoneMode = addElement('timezone-mode', { value: 'utc' });
  timezoneMode.checked = true;

  for (const [name, label] of [
    ['example-json', '填入示例 JSON'], ['format-json', '格式化 JSON'],
    ['minify-json', '压缩 JSON'], ['escape-json', '转义文本'],
    ['unescape-json', '去除转义'], ['copy-json', '复制处理结果'],
    ['toggle-json-tree', '树形视图'], ['expand-json-tree', '全部展开'],
    ['collapse-json-tree', '全部收起'], ['clear-json-history', '清空历史'],
    ['clear-json', '清空 JSON 内容'], ['convert-timestamp', '转换时间戳'],
    ['convert-date', '转换为时间戳'], ['current-time', '使用当前时间'],
    ['copy-timestamp', '复制时间戳结果'], ['clear-timestamp', '清空时间戳内容']
  ]) addAction(name, label);

  const window = {
    addEventListener() {},
    setInterval() { return 1; },
    clearInterval() {},
    setTimeout(callback) {
      const id = nextTimer++;
      timers.set(id, callback);
      timerCallbacks.set(id, callback);
      return id;
    },
    clearTimeout(id) { timers.delete(id); }
  };

  return { document, window, elements, actions, timers, timerCallbacks };
}

const harness = createHarness();
const localStorage = new FakeStorage();
const clipboardWrites = [];
Object.defineProperties(globalThis, {
  document: { configurable: true, value: harness.document },
  window: { configurable: true, value: harness.window },
  location: { configurable: true, value: { hash: '#json' } },
  history: { configurable: true, value: { replaceState() {} } },
  navigator: {
    configurable: true,
    value: { clipboard: { writeText: value => clipboardWrites.shift()(value) } }
  },
  localStorage: { configurable: true, value: localStorage }
});

await import(`../assets/js/app.mjs?copy-race=${Date.now()}`);

test('new JSON, timestamp, and date errors remain authoritative over older clipboard promises', async () => {
  const { actions, elements } = harness;

  elements.get('json-input').value = '{"ok":true}';
  await actions.get('format-json').dispatch('click');
  const jsonCopy = deferred();
  let jsonCopyStarted = false;
  clipboardWrites.push(() => {
    jsonCopyStarted = true;
    return jsonCopy.promise;
  });
  const pendingJsonCopy = actions.get('copy-json').dispatch('click');
  assert.equal(jsonCopyStarted, true);
  elements.get('json-input').value = '{';
  await actions.get('format-json').dispatch('click');
  assert.equal(elements.get('json-status').dataset.status, 'error');
  const jsonError = elements.get('json-status').textContent;
  jsonCopy.resolve();
  await pendingJsonCopy;
  assert.equal(elements.get('json-status').dataset.status, 'error');
  assert.equal(elements.get('json-status').textContent, jsonError);
  assert.equal(actions.get('copy-json').textContent, '复制处理结果');

  elements.get('timestamp-input').value = '0';
  await actions.get('convert-timestamp').dispatch('click');
  const timestampCopy = deferred();
  let timestampCopyStarted = false;
  clipboardWrites.push(() => {
    timestampCopyStarted = true;
    return timestampCopy.promise;
  });
  await actions.get('copy-timestamp').dispatch('click');
  assert.equal(timestampCopyStarted, true);
  elements.get('timestamp-input').value = 'not-a-timestamp';
  await actions.get('convert-timestamp').dispatch('click');
  assert.equal(elements.get('timestamp-error').dataset.status, 'error');
  const timestampError = elements.get('timestamp-error').textContent;
  timestampCopy.resolve();
  await Promise.resolve();
  assert.equal(elements.get('timestamp-error').dataset.status, 'error');
  assert.equal(elements.get('timestamp-error').textContent, timestampError);
  assert.equal(actions.get('copy-timestamp').textContent, '复制时间戳结果');

  await actions.get('clear-timestamp').dispatch('click');
  elements.get('date-input').value = '2026-01-15';
  elements.get('time-input').value = '12:34:56';
  await actions.get('convert-date').dispatch('click');
  const dateCopy = deferred();
  let dateCopyStarted = false;
  clipboardWrites.push(() => {
    dateCopyStarted = true;
    return dateCopy.promise;
  });
  await actions.get('copy-timestamp').dispatch('click');
  assert.equal(dateCopyStarted, true);
  elements.get('date-input').value = '2026-02-30';
  await actions.get('convert-date').dispatch('click');
  assert.equal(elements.get('date-error').dataset.status, 'error');
  const dateError = elements.get('date-error').textContent;
  dateCopy.resolve();
  await Promise.resolve();
  assert.equal(elements.get('date-error').dataset.status, 'error');
  assert.equal(elements.get('date-error').textContent, dateError);
  assert.equal(actions.get('copy-timestamp').textContent, '复制时间戳结果');

  elements.get('json-input').value = '{"fresh":true}';
  await actions.get('format-json').dispatch('click');
  clipboardWrites.push(() => Promise.resolve());
  await actions.get('copy-json').dispatch('click');
  const staleReset = harness.timerCallbacks.get(Math.max(...harness.timerCallbacks.keys()));
  elements.get('json-input').value = '{';
  await actions.get('format-json').dispatch('click');
  const writesAfterInvalidation = actions.get('copy-json').textWrites;
  staleReset();
  assert.equal(actions.get('copy-json').textWrites, writesAfterInvalidation);
});

function descendants(root) {
  return root.children.flatMap(child => [child, ...descendants(child)]);
}

function historyButton(kind, index = 0) {
  return descendants(harness.elements.get('json-history-list'))
    .filter(element => element.dataset[kind])[index];
}

test('JSON transforms save only successful operations and restore or remove local history', async () => {
  const { actions, elements } = harness;
  await actions.get('clear-json-history').dispatch('click');

  elements.get('json-input').value = '{"name":"DevKit","nested":{"ok":true}}';
  await actions.get('format-json').dispatch('click');
  assert.match(elements.get('json-output').value, /\n  "name"/);
  assert.equal(elements.get('json-history-list').children.length, 1);

  elements.get('json-input').value = 'line 1\n"quoted"';
  await actions.get('escape-json').dispatch('click');
  assert.equal(elements.get('json-output').value, 'line 1\\n\\"quoted\\"');
  assert.equal(elements.get('json-history-list').children.length, 2);
  assert.equal(actions.get('toggle-json-tree').disabled, true);

  elements.get('json-input').value = '{';
  await actions.get('format-json').dispatch('click');
  assert.equal(elements.get('json-history-list').children.length, 2);

  const restoreOlder = historyButton('historyRestore', 1);
  await restoreOlder.dispatch('click');
  assert.equal(elements.get('json-input').value, '{"name":"DevKit","nested":{"ok":true}}');
  assert.match(elements.get('json-output').value, /"nested"/);
  assert.equal(actions.get('toggle-json-tree').disabled, false);

  const deleteNewest = historyButton('historyDelete', 0);
  await deleteNewest.dispatch('click');
  assert.equal(elements.get('json-history-list').children.length, 1);

  await actions.get('clear-json').dispatch('click');
  assert.equal(elements.get('json-output').value, '');
  assert.equal(elements.get('json-history-list').children.length, 1);

  await actions.get('clear-json-history').dispatch('click');
  assert.equal(elements.get('json-history-list').children.length, 0);
  assert.equal(elements.get('json-history-empty').hidden, false);
});

test('JSON tree is safe, nested, switchable, and supports expand or collapse all', async () => {
  const { actions, elements } = harness;
  elements.get('json-input').value = '{"html":"<img src=x onerror=alert(1)>","nested":{"items":[1,{"deep":true}]}}';
  await actions.get('format-json').dispatch('click');

  assert.equal(elements.get('json-tree').children.length, 1);
  const details = elements.get('json-tree').querySelectorAll('details');
  assert.ok(details.length >= 4);
  assert.equal(details[0].open, true);
  assert.equal(details[1].open, true);
  assert.equal(details.at(-1).open, false);
  assert.ok(descendants(elements.get('json-tree')).some(node => node.textContent.includes('<img src=x')));
  assert.equal(descendants(elements.get('json-tree')).some(node => node.tagName === 'IMG'), false);

  await actions.get('toggle-json-tree').dispatch('click');
  assert.equal(elements.get('json-tree').hidden, false);
  assert.equal(elements.get('json-output').hidden, true);

  await actions.get('expand-json-tree').dispatch('click');
  assert.ok(details.every(detail => detail.open));
  await actions.get('collapse-json-tree').dispatch('click');
  assert.ok(details.every(detail => !detail.open));

  await actions.get('toggle-json-tree').dispatch('click');
  assert.equal(elements.get('json-tree').hidden, true);
  assert.equal(elements.get('json-output').hidden, false);
});

test('unescape failure invalidates clipboard authority without adding history', async () => {
  const { actions, elements } = harness;
  await actions.get('clear-json-history').dispatch('click');
  elements.get('json-input').value = 'ok\\nvalue';
  await actions.get('unescape-json').dispatch('click');
  assert.equal(elements.get('json-output').value, 'ok\nvalue');
  assert.equal(elements.get('json-history-list').children.length, 1);

  const pending = deferred();
  clipboardWrites.push(() => pending.promise);
  const copying = actions.get('copy-json').dispatch('click');
  elements.get('json-input').value = '\\q';
  await actions.get('unescape-json').dispatch('click');
  const authoritativeError = elements.get('json-status').textContent;
  assert.equal(elements.get('json-status').dataset.status, 'error');
  assert.equal(elements.get('json-history-list').children.length, 1);
  pending.resolve();
  await copying;
  assert.equal(elements.get('json-status').textContent, authoritativeError);
  assert.equal(actions.get('copy-json').textContent, '复制处理结果');
});
