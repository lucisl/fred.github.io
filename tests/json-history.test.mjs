import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadJsonHistory,
  saveJsonHistoryEntry,
  deleteJsonHistoryEntry,
  clearJsonHistory
} from '../assets/js/json-history.mjs';

const HISTORY_KEY = 'devkit.json.history.v1';

function memoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      return key === HISTORY_KEY ? value : null;
    },
    setItem(key, nextValue) {
      if (key === HISTORY_KEY) value = nextValue;
    },
    removeItem(key) {
      if (key === HISTORY_KEY) value = null;
    }
  };
}

test('loads no history when stored JSON is malformed', () => {
  // Break caught: parsing damaged browser storage would make the JSON tool unusable.
  assert.deepEqual(loadJsonHistory(memoryStorage('{bad json')), []);
});

test('returns no history when browser storage throws', () => {
  // Break caught: a browser privacy or quota exception would crash history rendering.
  const storage = { getItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadJsonHistory(storage), []);
});

test('deletes the displayed ID after recovering a row without persistent identity fields', () => {
  // Break caught: regenerating an ID on every load makes the row selected for deletion undeletable.
  const storage = memoryStorage(JSON.stringify([
    { operation: 'format', input: '{"a":1}', output: '{\n  "a": 1\n}' }
  ]));

  const [displayed] = loadJsonHistory(storage);
  assert.deepEqual(deleteJsonHistoryEntry(storage, displayed.id), []);
});

test('keeps the newest twenty entries when a twenty-first result is saved', () => {
  // Break caught: forgetting the cap would allow local history to grow without bound.
  const storage = memoryStorage();
  for (let index = 0; index < 21; index += 1) {
    saveJsonHistoryEntry(storage, {
      id: `id-${index}`,
      operation: 'format',
      input: `input-${index}`,
      output: `output-${index}`,
      createdAt: `2026-08-24T00:00:${String(index).padStart(2, '0')}.000Z`
    });
  }

  const entries = loadJsonHistory(storage);
  assert.equal(entries.length, 20);
  assert.equal(entries[0].input, 'input-20');
  assert.equal(entries.at(-1).input, 'input-1');
});

test('moves a matching operation and input to the top instead of saving a duplicate', () => {
  // Break caught: matching history rows would multiply instead of being refreshed.
  const storage = memoryStorage(JSON.stringify([
    { id: 'older', operation: 'format', input: '{"a":1}', output: '{\n  "a": 1\n}', createdAt: '2026-08-24T00:00:00.000Z' },
    { id: 'other', operation: 'minify', input: '{"b":2}', output: '{"b":2}', createdAt: '2026-08-24T00:01:00.000Z' }
  ]));

  const entries = saveJsonHistoryEntry(storage, {
    id: 'newer',
    operation: 'format',
    input: '{"a":1}',
    output: '{\n  "a": 1\n}',
    createdAt: '2026-08-24T00:02:00.000Z'
  });

  assert.deepEqual(entries.map(({ id, operation, input }) => ({ id, operation, input })), [
    { id: 'newer', operation: 'format', input: '{"a":1}' },
    { id: 'other', operation: 'minify', input: '{"b":2}' }
  ]);
});

test('deletes only the requested history entry', () => {
  // Break caught: deletion by an imprecise predicate could remove unrelated history.
  const storage = memoryStorage(JSON.stringify([
    { id: 'keep', operation: 'format', input: 'one', output: 'one', createdAt: '2026-08-24T00:00:00.000Z' },
    { id: 'remove', operation: 'minify', input: 'two', output: 'two', createdAt: '2026-08-24T00:01:00.000Z' }
  ]));

  assert.deepEqual(deleteJsonHistoryEntry(storage, 'remove').map(entry => entry.id), ['keep']);
});

test('clears every stored history entry', () => {
  // Break caught: clear could leave a stale empty-array record rather than removing saved history.
  const storage = memoryStorage(JSON.stringify([
    { id: 'old', operation: 'format', input: 'one', output: 'one', createdAt: '2026-08-24T00:00:00.000Z' }
  ]));

  assert.deepEqual(clearJsonHistory(storage), []);
  assert.equal(storage.getItem(HISTORY_KEY), null);
});

test('returns the in-memory result when saving history throws', () => {
  // Break caught: a storage exception would prevent a successful tool result from reaching history callers.
  const storage = {
    getItem() { return null; },
    setItem() { throw new Error('quota'); }
  };
  const entries = saveJsonHistoryEntry(storage, {
    id: 'saved', operation: 'escape', input: 'x', output: 'x', createdAt: '2026-08-24T00:00:00.000Z'
  });
  assert.deepEqual(entries.map(entry => entry.input), ['x']);
});
