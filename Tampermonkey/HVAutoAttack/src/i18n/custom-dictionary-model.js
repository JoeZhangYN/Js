export const CUSTOM_DICTIONARY_SCHEMA_VERSION = 1;

export function emptyCustomDictionary() {
  return { schemaVersion: CUSTOM_DICTIONARY_SCHEMA_VERSION, entries: [] };
}

function normalizeEntry(entry) {
  const group = String(entry?.group || "").trim();
  const source = String(entry?.source || "").trim();
  const zhCN = String(entry?.zhCN || "").trim();
  return group && source && zhCN ? { group, source, zhCN } : null;
}

export function normalizeCustomDictionary(value) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (
    !parsed ||
    parsed.schemaVersion !== CUSTOM_DICTIONARY_SCHEMA_VERSION ||
    !Array.isArray(parsed.entries)
  ) {
    throw new TypeError("Unsupported custom dictionary schema");
  }
  const entries = parsed.entries.map(normalizeEntry);
  if (entries.some((entry) => !entry)) throw new TypeError("Invalid custom dictionary entry");
  return { schemaVersion: CUSTOM_DICTIONARY_SCHEMA_VERSION, entries };
}

function entryKey(entry) {
  return `${entry.group}\u0000${entry.source}`;
}

export function mergeCustomDictionaries(current, incoming) {
  const merged = new Map(current.entries.map((entry) => [entryKey(entry), entry]));
  for (const entry of incoming.entries) merged.set(entryKey(entry), entry);
  return {
    schemaVersion: CUSTOM_DICTIONARY_SCHEMA_VERSION,
    entries: [...merged.values()],
  };
}
