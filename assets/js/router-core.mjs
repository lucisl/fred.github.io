export function normalizeToolHash(hash = '') {
  const tool = hash.replace(/^#/, '').toLowerCase();
  return tool === 'timestamp' ? 'timestamp' : 'json';
}
