export function safeDebug(deps, label, evidence) {
  try {
    deps.debug?.(label, evidence);
  } catch (_error) {
    return false;
  }
  return true;
}
