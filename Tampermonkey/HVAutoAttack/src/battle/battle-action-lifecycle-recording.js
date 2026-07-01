const REASON_LIFECYCLE_EVIDENCE_WRITE_FAILED = "lifecycleEvidenceWriteFailed";

export function recordLifecycleSafely(deps, phase, result, steps) {
  try {
    return deps.recordLifecycle(phase, result, steps);
  } catch (error) {
    steps.push({
      step: "recordLifecycle",
      result: false,
      reason: REASON_LIFECYCLE_EVIDENCE_WRITE_FAILED,
      error: error?.message || String(error),
    });
    try {
      deps.recordLifecycle?.(phase, result, steps);
    } catch (_error) {
      return false;
    }
    return false;
  }
}
