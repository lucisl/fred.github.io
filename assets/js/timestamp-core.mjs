const RELATIVE_UNITS = [
  ['年', 31_536_000_000], ['个月', 2_592_000_000], ['天', 86_400_000],
  ['小时', 3_600_000], ['分钟', 60_000], ['秒', 1_000]
];

const failure = error => ({ ok: false, error });
const DATE_PART_KEYS = ['year', 'month', 'day', 'hour', 'minute', 'second'];
const OFFSET_SAMPLE_DELTAS = [-172_800_000, -86_400_000, 0, 86_400_000, 172_800_000];

function partsToUtcMilliseconds({ year, month, day, hour, minute, second }) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date.getTime();
}

function sameDateParts(left, right) {
  return DATE_PART_KEYS.every(key => left[key] === right[key]);
}

export function isValidTimeZone(zone) {
  if (typeof zone !== 'string' || zone.length === 0) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}

export function datePartsInZone(milliseconds, zone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const values = {};
  for (const { type, value } of formatter.formatToParts(new Date(milliseconds))) {
    if (DATE_PART_KEYS.includes(type)) {
      values[type] = Number(value);
    }
  }
  return values;
}

export function formatDateInZone(milliseconds, zone) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: zone
  }).format(new Date(milliseconds));
}

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

export function timestampToRepresentations(source, unit = 'auto', nowMs = Date.now(), zone = 'local') {
  const normalized = normalizeTimestamp(source, unit);
  if (!normalized.ok) return normalized;
  if (!['local', 'utc'].includes(zone) && !isValidTimeZone(zone)) {
    return failure('时区不存在，请检查选择。');
  }

  const date = new Date(normalized.milliseconds);
  const local = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full', timeStyle: 'medium' }).format(date);
  return {
    ...normalized,
    local,
    utc: date.toUTCString(),
    iso: date.toISOString(),
    relative: formatRelative(normalized.milliseconds, nowMs),
    zoned: zone === 'local'
      ? local
      : formatDateInZone(normalized.milliseconds, zone === 'utc' ? 'UTC' : zone),
    timeZone: zone
  };
}

export function dateTimeToTimestamps(datePart, timePart, zone = 'local') {
  const dateMatch = datePart.match(/^(\d{4,})-(\d{2})-(\d{2})$/);
  const timeMatch = timePart.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!dateMatch || !timeMatch) return failure('请选择完整且有效的日期与时间。');

  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hour, minute, second = 0] = timeMatch.slice(1).map(Number);
  if (year < 1) return failure('日期或时间不存在，请检查输入。');

  if (!['local', 'utc'].includes(zone)) {
    if (!isValidTimeZone(zone)) return failure('时区不存在，请检查选择。');

    const requested = { year, month, day, hour, minute, second };
    const wallMilliseconds = partsToUtcMilliseconds(requested);
    if (!Number.isFinite(wallMilliseconds)) {
      return failure('日期或时间不存在，请检查输入。');
    }

    const offsets = new Set();
    for (const delta of OFFSET_SAMPLE_DELTAS) {
      const sample = wallMilliseconds + delta;
      if (Number.isNaN(new Date(sample).getTime())) continue;
      offsets.add(partsToUtcMilliseconds(datePartsInZone(sample, zone)) - sample);
    }
    const candidates = [...offsets]
      .map(offset => wallMilliseconds - offset)
      .filter(milliseconds => (
        !Number.isNaN(new Date(milliseconds).getTime())
        && sameDateParts(datePartsInZone(milliseconds, zone), requested)
      ))
      .sort((left, right) => left - right);
    const milliseconds = candidates[0];

    if (milliseconds === undefined) {
      return failure('日期或时间不存在，请检查输入。');
    }

    const zonedDate = new Date(milliseconds);
    return {
      ok: true,
      seconds: Math.floor(milliseconds / 1000),
      milliseconds,
      iso: zonedDate.toISOString()
    };
  }

  const check = new Date(0);
  if (zone === 'utc') {
    check.setUTCFullYear(year, month - 1, day);
    check.setUTCHours(hour, minute, second, 0);
  } else {
    check.setFullYear(year, month - 1, day);
    check.setHours(hour, minute, second, 0);
  }
  const milliseconds = check.getTime();
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
