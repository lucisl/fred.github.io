import { formatJson, minifyJson } from './json-core.mjs';
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
const copyResetTimers = new WeakMap();

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

function runJson(mode) {
  const result = mode === 'minify'
    ? minifyJson(jsonInput.value)
    : formatJson(jsonInput.value, indentSelect.value);

  if (!result.ok) {
    jsonOutput.value = '';
    const locationMessage = result.position === null ? '' : `（字符 ${result.position + 1}）`;
    setStatus(jsonStatus, 'error', `${result.error}${locationMessage}`);
    updateJsonCounters();
    jsonInput.focus();
    return;
  }

  jsonOutput.value = result.output;
  setStatus(
    jsonStatus,
    'success',
    mode === 'minify' ? '已压缩为单行 JSON。' : 'JSON 格式正确，已完成格式化。'
  );
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
  const now = new Date();
  timestampInput.value = String(now.getTime());
  dateInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  timeInput.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  detectedUnit.textContent = '—';
  clearElements(timestampResults);
  clearElements(dateResults);
  setStatus(timestampStatus, 'idle', '已填入当前毫秒级时间戳。');
  setStatus(dateStatus, 'idle', '已填入当前本地日期与时间。');
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
  const original = trigger.dataset.copyLabel || trigger.textContent;
  trigger.dataset.copyLabel = original;
  let copied = false;

  try {
    if (!value) throw new Error('empty');
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else fallbackCopy(value);
    copied = true;
    trigger.textContent = '已复制';
    setStatus(statusTarget, 'success', '结果已复制到剪贴板。');
  } catch {
    trigger.textContent = '复制失败';
    setStatus(statusTarget, 'error', value ? '无法访问剪贴板，请手动复制。' : '没有可复制的结果。');
  }

  window.clearTimeout(copyResetTimers.get(trigger));
  const resetTimer = window.setTimeout(() => {
    trigger.textContent = original;
    delete trigger.dataset.copyLabel;
    copyResetTimers.delete(trigger);
  }, 1600);
  copyResetTimers.set(trigger, resetTimer);

  return copied;
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
  jsonInput.value = JSON.stringify(JSON_EXAMPLE);
  jsonOutput.value = '';
  setStatus(jsonStatus, 'idle', '示例 JSON 已填入，可以开始处理。');
  updateJsonCounters();
  jsonInput.focus();
});
action('format-json').addEventListener('click', () => runJson('format'));
action('minify-json').addEventListener('click', () => runJson('minify'));
action('copy-json').addEventListener('click', event => copyText(jsonOutput.value, event.currentTarget, jsonStatus));
action('clear-json').addEventListener('click', () => {
  jsonInput.value = '';
  jsonOutput.value = '';
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
updateJsonCounters();
renderRoute();
syncClock();
