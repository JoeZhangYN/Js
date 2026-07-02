import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export function recordBattleActionUsageCaptureFailure(stage, detail = {}) {
  const evidence = { capability: "battleActionUsageCapture", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_USAGE_CAPTURE_FAILURE,
      JSON.stringify(evidence)
    );
  } catch (_error) {
    // Usage capture failure evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] battle action usage capture failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}
