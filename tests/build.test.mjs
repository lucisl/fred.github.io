import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

async function listFiles(directory, relative = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(directory, entry.name), entryRelative);
    return [entryRelative];
  }));
  return files.flat().sort();
}

test('build script creates a deployable artifact without development files', async () => {
  await execFileAsync(process.execPath, ['scripts/build.mjs'], { cwd: root });

  assert.deepEqual(await listFiles(dist), [
    '.nojekyll',
    'assets/favicon.svg',
    'assets/js/app.mjs',
    'assets/js/json-core.mjs',
    'assets/js/json-history.mjs',
    'assets/js/router-core.mjs',
    'assets/js/timestamp-core.mjs',
    'assets/styles.css',
    'index.html',
  ]);
});
