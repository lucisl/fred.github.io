import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatJson,
  minifyJson,
  escapeJsonText,
  unescapeJsonText,
  JSON_EMPTY_ERROR
} from '../assets/js/json-core.mjs';

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

test('escapes quote slash newline tab and unicode for the inside of a JSON string', () => {
  // Break caught: omitting a JSON string escape would emit text that changes value when parsed.
  assert.deepEqual(escapeJsonText('a"b\\c\nd\te你好'), {
    ok: true,
    output: 'a\\"b\\\\c\\nd\\te你好'
  });
});

test('unescapes JSON string content with or without outer quotes', () => {
  // Break caught: treating an outer quoted JSON string as raw escape content would retain the quotes.
  assert.deepEqual(unescapeJsonText('"a\\nb"'), { ok: true, output: 'a\nb' });
  assert.deepEqual(unescapeJsonText('a\\"b\\\\c\\nd\\te你好'), {
    ok: true,
    output: 'a"b\\c\nd\te你好'
  });
});

test('rejects malformed escape sequences without replacing the submitted text', () => {
  // Break caught: accepting invalid escape syntax would silently corrupt user text.
  assert.deepEqual(unescapeJsonText('keep\\qthis'), {
    ok: false,
    error: 'JSON 转义解析失败：无效的转义内容。',
    position: null
  });
});
