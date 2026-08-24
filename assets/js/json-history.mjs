const HISTORY_KEY = 'devkit.json.history.v1';
const HISTORY_LIMIT = 20;
let fallbackIdSuffix = 0;

function createHistoryId() {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `fallback-${++fallbackIdSuffix}`;
  return `${Date.now()}-${suffix}`;
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object' || typeof entry.operation !== 'string'
    || typeof entry.input !== 'string' || !entry.input.trim() || typeof entry.output !== 'string') {
    return null;
  }

  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : createHistoryId(),
    operation: entry.operation,
    input: entry.input,
    output: entry.output,
    createdAt: typeof entry.createdAt === 'string' && entry.createdAt
      ? entry.createdAt
      : new Date().toISOString()
  };
}

function persist(storage, entries) {
  try {
    storage?.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

export function loadJsonHistory(storage) {
  try {
    const raw = storage?.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries = parsed.map(normalizeEntry).filter(Boolean).slice(0, HISTORY_LIMIT);
    if (JSON.stringify(entries) !== JSON.stringify(parsed)) persist(storage, entries);
    return entries;
  } catch {
    return [];
  }
}

export function saveJsonHistoryEntry(storage, entry) {
  const normalized = normalizeEntry(entry);
  if (!normalized) return loadJsonHistory(storage);

  const entries = [
    normalized,
    ...loadJsonHistory(storage).filter((saved) =>
      saved.operation !== normalized.operation || saved.input !== normalized.input
    )
  ].slice(0, HISTORY_LIMIT);
  persist(storage, entries);
  return entries;
}

export function deleteJsonHistoryEntry(storage, id) {
  const entries = loadJsonHistory(storage).filter(entry => entry.id !== id);
  persist(storage, entries);
  return entries;
}

export function clearJsonHistory(storage) {
  try {
    storage?.removeItem(HISTORY_KEY);
  } catch {
    // Clearing history must not interrupt the JSON tool when storage is unavailable.
  }
  return [];
}
