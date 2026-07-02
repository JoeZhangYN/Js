import { DIAGNOSTIC_EVIDENCE_SOURCES } from "./diagnostic-evidence-keys.js";

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch (_error) {
    return undefined;
  }
}

export function readRecentDiagnosticEvidence(storage = window.sessionStorage, options = {}) {
  const excludedKeys = new Set(options.excludeKeys || []);
  const evidence = {};
  for (const item of DIAGNOSTIC_EVIDENCE_SOURCES) {
    if (excludedKeys.has(item.key)) continue;
    const value = readJson(storage, item.key);
    if (value) evidence[item.name] = value;
  }
  return Object.keys(evidence).length ? evidence : undefined;
}
