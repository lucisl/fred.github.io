import { access, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist);
await cp(path.join(root, 'index.html'), path.join(dist, 'index.html'));
await cp(path.join(root, '.nojekyll'), path.join(dist, '.nojekyll'));
await cp(path.join(root, 'assets'), path.join(dist, 'assets'), { recursive: true });
await Promise.all(['index.html', 'assets/styles.css', 'assets/js/app.mjs']
  .map((file) => access(path.join(dist, file))));

console.log('Static site built in dist/');
