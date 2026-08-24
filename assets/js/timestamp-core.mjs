const RELATIVE_UNITS = [
  ['年', 31_536_000_000], ['个月', 2_592_000_000], ['天', 86_400_000],
  ['小时', 3_600_000], ['分钟', 60_000], ['秒', 1_000]
];

const failure = error => ({ ok: false, error });

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

  return {
    ok: true,
    seconds: Math.floor(milliseconds / 1000),
    milliseconds,
    iso: check.toISOString()
  };
}
