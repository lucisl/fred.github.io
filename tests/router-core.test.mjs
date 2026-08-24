import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToolHash } from '../assets/js/router-core.mjs';

test('accepts the two known tools', () => {
  assert.equal(normalizeToolHash('#json'), 'json');
  assert.equal(normalizeToolHash('#timestamp'), 'timestamp');
});

test('falls back to JSON for empty or unknown hashes', () => {
  assert.equal(normalizeToolHash(''), 'json');
  assert.equal(normalizeToolHash('#other'), 'json');
});
