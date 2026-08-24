import { escapeJsonText, formatJson, minifyJson, unescapeJsonText } from './json-core.mjs';
import {
  clearJsonHistory,
  deleteJsonHistoryEntry,
  loadJsonHistory,
  saveJsonHistoryEntry
} from './json-history.mjs';
import { dateTimeToTimestamps, timestampToRepresentations } from './timestamp-core.mjs';
import { normalizeToolHash } from './router-core.mjs';

const JSON_EXAMPLE = {
  项目: '开发工具箱',
  已上线: true,
  功能: ['JSON 格式化', '时间戳转换'],
  维护者: { 姓名: '小林', 城市: '上海' }
};

const jsonInput = document.querySelector('#json-input');
const jsonOutput = document.querySelector('#json-output');
const indentSelect = document.querySelector('#json-indent');
const jsonInputCount = document.querySelector('#json-input-count');
const jsonOutputCount = document.querySelector('#json-output-count');
const jsonStatus = document.querySelector('#json-status');
const jsonTree = document.querySelector('#json-tree');
const jsonHistoryList = document.querySelector('#json-history-list');
const jsonHistoryEmpty = document.querySelector('#json-history-empty');

const timestampInput = document.querySelector('#timestamp-input');
const timestampUnit = document.querySelector('#timestamp-unit');
const timestampStatus = document.querySelector('#timestamp-error');
const dateInput = document.querySelector('#date-input');
const timeInput = document.querySelector('#time-input');
const dateStatus = document.querySelector('#date-error');
const currentTime = document.querySelector('#current-time');
const localZone = document.querySelector('#local-zone');
const detectedUnit = document.querySelector('#timestamp-detected-unit');

const timestampResults = {
  local: document.querySelector('#timestamp-local'),
  utc: document.querySelector('#timestamp-utc'),
  iso: document.querySelector('#timestamp-iso'),
  relative: document.querySelector('#timestamp-relative')
};

const dateResults = {
  seconds: document.querySelector('#date-seconds'),
  milliseconds: document.querySelector('#date-milliseconds'),
  iso: document.querySelector('#date-iso')
};

let clockTimer;
const copyOperations = new WeakMap();
let jsonStorage = null;
try {
  jsonStorage = globalThis.localStorage;
} catch {
  // Some browser privacy modes deny access before a Storage method can be called.
}
let jsonHistory = loadJsonHistory(jsonStorage);
let jsonTreeAvailable = false;
let jsonTreeVisible = false;

function action(name) {
  return document.querySelector(`[data-action="${name}"]`);
}

function setStatus(target, state, message) {
  target.dataset.status = state;
  target.textContent = message;
}

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

function updateJsonCounters() {
  jsonInputCount.textContent = `输入：${jsonInput.value.length} 个字符`;
  jsonOutputCount.textContent = `输出：${jsonOutput.value.length} 个字符`;
}

const JSON_OPERATIONS = {
  format: {
    run: () => formatJson(jsonInput.value, indentSelect.value),
    success: 'JSON 格式正确，已完成格式化。',
    label: '格式化',
    tree: true
  },
  minify: {
    run: () => minifyJson(jsonInput.value),
    success: '已压缩为单行 JSON。',
    label: '压缩',
    tree: true
  },
  escape: {
    run: () => escapeJsonText(jsonInput.value),
    success: '文本已转换为 JSON 转义内容。',
    label: '转义',
    tree: false
  },
  unescape: {
    run: () => unescapeJsonText(jsonInput.value),
    success: 'JSON 转义内容已还原为文本。',
    label: '去转义',
    tree: false
  }
};

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function primitiveText(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null) return 'null';
  return String(value);
}

function treeNode(value, key, depth) {
  const keyPrefix = key === null ? '' : `${JSON.stringify(String(key))}: `;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value);
    const type = Array.isArray(value) ? 'array' : 'object';
    const details = document.createElement('details');
    details.className = `json-tree-node json-tree-${type}`;
    details.open = depth < 2;
    const summary = document.createElement('summary');
    summary.append(
      createTextElement('span', 'json-tree-key', keyPrefix),
      createTextElement('span', 'json-tree-bracket', type === 'array' ? '[' : '{'),
      createTextElement('span', 'json-tree-count', `${entries.length} 项`),
      createTextElement('span', 'json-tree-bracket', type === 'array' ? ']' : '}')
    );
    details.append(summary);
    const children = document.createElement('div');
    children.className = 'json-tree-children';
    entries.forEach(([childKey, childValue]) => {
      children.append(treeNode(childValue, childKey, depth + 1));
    });
    details.append(children);
    return details;
  }

  const row = document.createElement('div');
  const type = value === null ? 'null' : typeof value;
  row.className = 'json-tree-value-row';
  row.append(
    createTextElement('span', 'json-tree-key', keyPrefix),
    createTextElement('span', `json-tree-value json-tree-value-${type}`, primitiveText(value))
  );
  return row;
}

function setTreeMode(visible) {
  jsonTreeVisible = Boolean(visible && jsonTreeAvailable);
  jsonTree.hidden = !jsonTreeVisible;
  jsonOutput.hidden = jsonTreeVisible;
  action('toggle-json-tree').textContent = jsonTreeVisible ? '文本视图' : '树形视图';
  action('expand-json-tree').disabled = !jsonTreeVisible;
  action('collapse-json-tree').disabled = !jsonTreeVisible;
}

function resetJsonTree() {
  jsonTree.replaceChildren();
  jsonTreeAvailable = false;
  action('toggle-json-tree').disabled = true;
  setTreeMode(false);
}

function renderJsonTree(output) {
  try {
    jsonTree.replaceChildren(treeNode(JSON.parse(output), null, 0));
    jsonTreeAvailable = true;
    action('toggle-json-tree').disabled = false;
    setTreeMode(false);
  } catch {
    resetJsonTree();
  }
}

function formatHistoryTime(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function restoreHistoryEntry(entry) {
  resetCopyFeedback(action('copy-json'));
  jsonInput.value = entry.input;
  jsonOutput.value = entry.output;
  if (JSON_OPERATIONS[entry.operation]?.tree) renderJsonTree(entry.output);
  else resetJsonTree();
  setStatus(jsonStatus, 'success', `已恢复${JSON_OPERATIONS[entry.operation]?.label || ''}历史记录。`);
  updateJsonCounters();
  jsonInput.focus();
}

function renderJsonHistory() {
  const items = jsonHistory.map(entry => {
    const item = document.createElement('li');
    item.className = 'json-history-item';
    const meta = document.createElement('div');
    meta.className = 'json-history-meta';
    meta.append(
      createTextElement('strong', '', JSON_OPERATIONS[entry.operation]?.label || entry.operation),
      createTextElement('time', '', formatHistoryTime(entry.createdAt))
    );
    const preview = createTextElement('p', 'json-history-preview', entry.input.replace(/\s+/g, ' ').slice(0, 88));
    const controls = document.createElement('div');
    controls.className = 'json-history-actions';
    const restore = createTextElement('button', '', '恢复');
    restore.type = 'button';
    restore.dataset.historyRestore = entry.id;
    restore.addEventListener('click', () => restoreHistoryEntry(entry));
    const remove = createTextElement('button', '', '删除');
    remove.type = 'button';
    remove.dataset.historyDelete = entry.id;
    remove.addEventListener('click', () => {
      jsonHistory = deleteJsonHistoryEntry(jsonStorage, entry.id);
      renderJsonHistory();
    });
    controls.append(restore, remove);
    item.append(meta, preview, controls);
    return item;
  });
  jsonHistoryList.replaceChildren(...items);
  jsonHistoryEmpty.hidden = jsonHistory.length > 0;
}

function runJson(mode) {
  resetCopyFeedback(action('copy-json'));
  const operation = JSON_OPERATIONS[mode];
  const input = jsonInput.value;
  const result = operation.run();

  if (!result.ok) {
    jsonOutput.value = '';
    resetJsonTree();
    const locationMessage = result.position === null ? '' : `（字符 ${result.position + 1}）`;
    setStatus(jsonStatus, 'error', `${result.error}${locationMessage}`);
    updateJsonCounters();
    jsonInput.focus();
    return;
  }

  jsonOutput.value = result.output;
  if (operation.tree) renderJsonTree(result.output);
  else resetJsonTree();
  jsonHistory = saveJsonHistoryEntry(jsonStorage, {
    operation: mode,
    input,
    output: result.output
  });
  renderJsonHistory();
  setStatus(jsonStatus, 'success', operation.success);
  updateJsonCounters();
}

function clearElements(elements) {
  Object.values(elements).forEach(element => {
    element.textContent = '—';
  });
}

function renderTimestampError(message) {
  detectedUnit.textContent = '—';
  clearElements(timestampResults);
  setStatus(timestampStatus, 'error', message);
  timestampInput.focus();
}

function convertTimestamp() {
  resetCopyFeedback(action('copy-timestamp'));
  const result = timestampToRepresentations(timestampInput.value, timestampUnit.value);
  if (!result.ok) {
    renderTimestampError(result.error);
    return;
  }

  timestampResults.local.textContent = result.local;
  timestampResults.utc.textContent = result.utc;
  timestampResults.iso.textContent = result.iso;
  timestampResults.relative.textContent = result.relative;
  detectedUnit.textContent = result.detectedUnit === 'seconds' ? '秒级' : '毫秒级';
  setStatus(timestampStatus, 'success', '时间戳转换完成。');
}

function selectedZone() {
  return document.querySelector('input[name="timezone-mode"]:checked').value;
}

function renderDateError(message) {
  clearElements(dateResults);
  setStatus(dateStatus, 'error', message);
  (dateInput.value ? timeInput : dateInput).focus();
}

function convertDate() {
  resetCopyFeedback(action('copy-timestamp'));
  const result = dateTimeToTimestamps(dateInput.value, timeInput.value, selectedZone());
  if (!result.ok) {
    renderDateError(result.error);
    return;
  }

  dateResults.seconds.textContent = String(result.seconds);
  dateResults.milliseconds.textContent = String(result.milliseconds);
  dateResults.iso.textContent = result.iso;
  setStatus(dateStatus, 'success', '日期时间转换完成。');
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function useCurrentTime() {
  resetCopyFeedback(action('copy-timestamp'));
  const now = new Date();
  const milliseconds = now.getTime();
  const unit = timestampUnit.value;
  const utc = selectedZone() === 'utc';
  const get = part => now[`${utc ? 'getUTC' : 'get'}${part}`]();

  timestampInput.value = String(unit === 'seconds' ? Math.floor(milliseconds / 1000) : milliseconds);
  dateInput.value = `${get('FullYear')}-${pad(get('Month') + 1)}-${pad(get('Date'))}`;
  timeInput.value = `${pad(get('Hours'))}:${pad(get('Minutes'))}:${pad(get('Seconds'))}`;
  detectedUnit.textContent = '—';
  clearElements(timestampResults);
  clearElements(dateResults);
  setStatus(timestampStatus, 'idle', `已填入当前${unit === 'seconds' ? '秒级' : '毫秒级'}时间戳。`);
  setStatus(dateStatus, 'idle', `已填入当前${utc ? 'UTC' : '本地'}日期与时间。`);
}

function fallbackCopy(value) {
  const temporary = document.createElement('textarea');
  temporary.value = value;
  temporary.setAttribute('readonly', '');
  temporary.style.position = 'fixed';
  temporary.style.opacity = '0';
  document.body.append(temporary);
  try {
    temporary.select();
    if (!document.execCommand('copy')) throw new Error('copy failed');
  } finally {
    temporary.remove();
  }
}

async function copyText(value, trigger, statusTarget) {
  const previous = copyOperations.get(trigger);
  const original = previous?.original || trigger.dataset.copyLabel || trigger.textContent;
  const generation = (previous?.generation || 0) + 1;
  window.clearTimeout(previous?.resetTimer);
  copyOperations.set(trigger, { generation, original, resetTimer: null });
  trigger.dataset.copyLabel = original;
  let copied = false;

  try {
    if (!value) throw new Error('empty');
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else fallbackCopy(value);
    if (copyOperations.get(trigger)?.generation !== generation) return false;
    copied = true;
    trigger.textContent = '已复制';
    setStatus(statusTarget, 'success', '结果已复制到剪贴板。');
  } catch {
    if (copyOperations.get(trigger)?.generation !== generation) return false;
    trigger.textContent = '复制失败';
    setStatus(statusTarget, 'error', value ? '无法访问剪贴板，请手动复制。' : '没有可复制的结果。');
  }

  const resetTimer = window.setTimeout(() => {
    const current = copyOperations.get(trigger);
    if (current?.generation !== generation) return;
    trigger.textContent = original;
    delete trigger.dataset.copyLabel;
    current.resetTimer = null;
  }, 1600);
  copyOperations.get(trigger).resetTimer = resetTimer;

  return copied;
}

function resetCopyFeedback(trigger) {
  const previous = copyOperations.get(trigger);
  const original = previous?.original || trigger.dataset.copyLabel || trigger.textContent;
  window.clearTimeout(previous?.resetTimer);
  copyOperations.set(trigger, {
    generation: (previous?.generation || 0) + 1,
    original,
    resetTimer: null
  });
  trigger.textContent = original;
  delete trigger.dataset.copyLabel;
}

function timestampCopyValue() {
  const lines = [];
  if (timestampResults.iso.textContent !== '—') {
    lines.push(
      `识别单位：${detectedUnit.textContent}`,
      `本地时间：${timestampResults.local.textContent}`,
      `UTC 时间：${timestampResults.utc.textContent}`,
      `ISO 8601：${timestampResults.iso.textContent}`,
      `相对时间：${timestampResults.relative.textContent}`
    );
  }
  if (dateResults.iso.textContent !== '—') {
    lines.push(
      `秒级时间戳：${dateResults.seconds.textContent}`,
      `毫秒级时间戳：${dateResults.milliseconds.textContent}`,
      `ISO 8601：${dateResults.iso.textContent}`
    );
  }
  return lines.join('\n');
}

function clearTimestampTool() {
  resetCopyFeedback(action('copy-timestamp'));
  timestampInput.value = '';
  dateInput.value = '';
  timeInput.value = '';
  detectedUnit.textContent = '—';
  clearElements(timestampResults);
  clearElements(dateResults);
  setStatus(timestampStatus, 'idle', '输入时间戳后开始转换。');
  setStatus(dateStatus, 'idle', '选择日期与时间后开始转换。');
  timestampInput.focus();
}

function renderCurrentTime() {
  const now = new Date();
  currentTime.textContent = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'full',
    timeStyle: 'medium'
  }).format(now);
}

function syncClock() {
  window.clearInterval(clockTimer);
  if (document.visibilityState !== 'visible') return;
  renderCurrentTime();
  clockTimer = window.setInterval(renderCurrentTime, 1000);
}

window.addEventListener('hashchange', renderRoute);
document.addEventListener('visibilitychange', syncClock);
jsonInput.addEventListener('input', updateJsonCounters);

action('example-json').addEventListener('click', () => {
  resetCopyFeedback(action('copy-json'));
  jsonInput.value = JSON.stringify(JSON_EXAMPLE);
  jsonOutput.value = '';
  resetJsonTree();
  setStatus(jsonStatus, 'idle', '示例 JSON 已填入，可以开始处理。');
  updateJsonCounters();
  jsonInput.focus();
});
action('format-json').addEventListener('click', () => runJson('format'));
action('minify-json').addEventListener('click', () => runJson('minify'));
action('escape-json').addEventListener('click', () => runJson('escape'));
action('unescape-json').addEventListener('click', () => runJson('unescape'));
action('copy-json').addEventListener('click', event => copyText(jsonOutput.value, event.currentTarget, jsonStatus));
action('toggle-json-tree').addEventListener('click', () => setTreeMode(!jsonTreeVisible));
action('expand-json-tree').addEventListener('click', () => {
  jsonTree.querySelectorAll('details').forEach(details => { details.open = true; });
});
action('collapse-json-tree').addEventListener('click', () => {
  jsonTree.querySelectorAll('details').forEach(details => { details.open = false; });
});
action('clear-json-history').addEventListener('click', () => {
  jsonHistory = clearJsonHistory(jsonStorage);
  renderJsonHistory();
  setStatus(jsonStatus, 'idle', 'JSON 历史已清空。');
});
action('clear-json').addEventListener('click', () => {
  resetCopyFeedback(action('copy-json'));
  jsonInput.value = '';
  jsonOutput.value = '';
  resetJsonTree();
  setStatus(jsonStatus, 'idle', '输入 JSON 后选择操作。');
  updateJsonCounters();
  jsonInput.focus();
});

action('convert-timestamp').addEventListener('click', convertTimestamp);
action('convert-date').addEventListener('click', convertDate);
action('current-time').addEventListener('click', useCurrentTime);
action('copy-timestamp').addEventListener('click', event => {
  const statusTarget = timestampResults.iso.textContent === '—' ? dateStatus : timestampStatus;
  copyText(timestampCopyValue(), event.currentTarget, statusTarget);
});
action('clear-timestamp').addEventListener('click', clearTimestampTool);

localZone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || '本地时区';
resetJsonTree();
renderJsonHistory();
updateJsonCounters();
renderRoute();
syncClock();
