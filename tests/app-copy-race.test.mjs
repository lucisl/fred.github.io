import test from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(document, { textContent = '', value = '' } = {}) {
    this.document = document;
    this._textContent = textContent;
    this.textWrites = 0;
    this.value = value;
    this.dataset = {};
    this.style = {};
    this.listeners = new Map();
    this.attributes = new Map();
    this.checked = false;
    this.hidden = false;
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

  async dispatch(type) {
    const event = { currentTarget: this };
    const results = (this.listeners.get(type) || []).map(listener => listener(event));
    await Promise.all(results);
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
  remove() {}
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
    createElement() { return new FakeElement(document); },
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
    ['minify-json', '压缩 JSON'], ['copy-json', '复制处理结果'],
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
const clipboardWrites = [];
Object.defineProperties(globalThis, {
  document: { configurable: true, value: harness.document },
  window: { configurable: true, value: harness.window },
  location: { configurable: true, value: { hash: '#json' } },
  history: { configurable: true, value: { replaceState() {} } },
  navigator: {
    configurable: true,
    value: { clipboard: { writeText: value => clipboardWrites.shift()(value) } }
  }
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
