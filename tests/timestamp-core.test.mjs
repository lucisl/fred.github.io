import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTimestamp,
  timestampToRepresentations,
  dateTimeToTimestamps,
  formatRelative,
  isValidTimeZone,
  formatDateInZone,
  datePartsInZone
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

test('validates real IANA zones and rejects an unknown zone', () => {
  assert.equal(isValidTimeZone('Asia/Shanghai'), true);
  assert.equal(isValidTimeZone('America/New_York'), true);
  assert.equal(isValidTimeZone('Europe/London'), true);
  assert.equal(isValidTimeZone('Not/A_Real_Zone'), false);
  assert.equal(isValidTimeZone(''), false);
});

test('extracts literal date parts in the selected IANA zone', () => {
  assert.deepEqual(datePartsInZone(1704067200000, 'Asia/Shanghai'), {
    year: 2024, month: 1, day: 1, hour: 8, minute: 0, second: 0
  });
  assert.deepEqual(datePartsInZone(1704067200000, 'America/New_York'), {
    year: 2023, month: 12, day: 31, hour: 19, minute: 0, second: 0
  });
  assert.deepEqual(datePartsInZone(1704067200000, 'Europe/London'), {
    year: 2024, month: 1, day: 1, hour: 0, minute: 0, second: 0
  });
});

test('formats and reports a timestamp in the selected IANA zone', () => {
  assert.equal(
    formatDateInZone(1704067200000, 'Asia/Shanghai'),
    '2024年1月1日星期一 08:00:00'
  );
  assert.equal(
    formatDateInZone(1704067200000, 'America/New_York'),
    '2023年12月31日星期日 19:00:00'
  );
  assert.equal(
    formatDateInZone(1704067200000, 'Europe/London'),
    '2024年1月1日星期一 00:00:00'
  );

  const result = timestampToRepresentations(
    '1704067200', 'seconds', 1704067200000, 'America/New_York'
  );
  assert.equal(result.zoned, '2023年12月31日星期日 19:00:00');
  assert.equal(result.timeZone, 'America/New_York');
  assert.equal(timestampToRepresentations('0', 'seconds', 0, 'Not/A_Real_Zone').ok, false);
});

test('converts literal wall times in New York, Shanghai, and London', () => {
  assert.equal(
    dateTimeToTimestamps('2024-01-01', '00:00:00', 'America/New_York').milliseconds,
    1704085200000
  );
  assert.equal(
    dateTimeToTimestamps('2024-01-01', '00:00:00', 'Asia/Shanghai').milliseconds,
    1704038400000
  );
  assert.equal(
    dateTimeToTimestamps('2024-01-01', '00:00:00', 'Europe/London').milliseconds,
    1704067200000
  );
  assert.equal(
    dateTimeToTimestamps('2024-07-01', '00:00:00', 'America/New_York').milliseconds,
    1719806400000
  );
  assert.equal(
    dateTimeToTimestamps('2024-07-01', '00:00:00', 'Europe/London').milliseconds,
    1719788400000
  );
});

test('rejects invalid zones and nonexistent New York wall time', () => {
  assert.equal(dateTimeToTimestamps('2024-01-01', '00:00:00', 'Not/A_Real_Zone').ok, false);
  assert.equal(dateTimeToTimestamps('2024-03-10', '02:30:00', 'America/New_York').ok, false);
});

test('chooses the first occurrence of a repeated New York wall time', () => {
  assert.equal(
    dateTimeToTimestamps('2024-11-03', '01:30:00', 'America/New_York').milliseconds,
    1730611800000
  );
});

test('converts UTC date fields to seconds and milliseconds', () => {
  assert.deepEqual(dateTimeToTimestamps('1970-01-01', '00:00:01', 'utc'), {
    ok: true,
    seconds: 1,
    milliseconds: 1000,
    iso: '1970-01-01T00:00:01.000Z'
  });
});

test('strictly round-trips local date fields and rejects local rollover dates', () => {
  const result = dateTimeToTimestamps('2026-01-15', '12:34:56', 'local');
  assert.equal(result.ok, true);
  const localDate = new Date(result.milliseconds);
  assert.deepEqual([
    localDate.getFullYear(), localDate.getMonth() + 1, localDate.getDate(),
    localDate.getHours(), localDate.getMinutes(), localDate.getSeconds()
  ], [2026, 1, 15, 12, 34, 56]);
  assert.equal(dateTimeToTimestamps('2026-02-30', '12:00:00', 'local').ok, false);
});

test('preserves year 0099 in UTC and local date conversions', () => {
  const utc = dateTimeToTimestamps('0099-01-02', '03:04:05', 'utc');
  assert.deepEqual(utc, {
    ok: true,
    seconds: -59042897755,
    milliseconds: -59042897755000,
    iso: '0099-01-02T03:04:05.000Z'
  });

  const local = dateTimeToTimestamps('0099-01-02', '03:04:05', 'local');
  assert.equal(local.ok, true);
  const localDate = new Date(local.milliseconds);
  assert.deepEqual([
    localDate.getFullYear(), localDate.getMonth() + 1, localDate.getDate(),
    localDate.getHours(), localDate.getMinutes(), localDate.getSeconds()
  ], [99, 1, 2, 3, 4, 5]);
});

test('accepts valid five-digit years and rejects invalid or out-of-range extended years', () => {
  assert.deepEqual(dateTimeToTimestamps('10000-01-02', '03:04:05', 'utc'), {
    ok: true,
    seconds: 253402398245,
    milliseconds: 253402398245000,
    iso: '+010000-01-02T03:04:05.000Z'
  });
  assert.equal(dateTimeToTimestamps('10000-02-30', '03:04:05', 'utc').ok, false);
  assert.equal(dateTimeToTimestamps('0000-01-01', '00:00:00', 'utc').ok, false);
  assert.equal(dateTimeToTimestamps('99999999999999999999-01-01', '00:00:00', 'utc').ok, false);
});

test('preserves early and extended years through the IANA UTC zone', () => {
  assert.equal(
    dateTimeToTimestamps('0099-01-02', '03:04:05', 'UTC').milliseconds,
    -59042897755000
  );
  assert.equal(
    dateTimeToTimestamps('10000-01-02', '03:04:05', 'UTC').milliseconds,
    253402398245000
  );
});

test('formats past and future relative values', () => {
  assert.equal(formatRelative(60_000, 0), '1 分钟后');
  assert.equal(formatRelative(-7_200_000, 0), '2 小时前');
});

test('rejects blank, non-finite, malformed, and out-of-range values', () => {
  for (const value of ['', 'abc', 'Infinity', '1e100']) {
    assert.equal(normalizeTimestamp(value, 'auto').ok, false);
  }
  assert.equal(normalizeTimestamp('8640000000000001', 'milliseconds').ok, false);
  assert.equal(normalizeTimestamp('8640000000001', 'seconds').ok, false);
  assert.equal(dateTimeToTimestamps('', '12:00:00', 'utc').ok, false);
  assert.equal(dateTimeToTimestamps('2026-02-30', '12:00:00', 'utc').ok, false);
});
