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
