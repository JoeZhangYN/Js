const REASON_CONTINUATION_EVIDENCE_WRITE_FAILED = "nextRoundContinuationEvidenceWriteFailed";

export function recordContinuationSafely(deps, result, steps) {
  try {
    return deps.recordContinuation(result, steps);
  } catch (error) {
    steps.push({
      step: "recordContinuation",
      result: false,
      reason: REASON_CONTINUATION_EVIDENCE_WRITE_FAILED,
      error: error?.message || String(error),
    });
    try {
      deps.recordContinuation?.(result, steps);
    } catch (_error) {
      return false;
    }
    return false;
  }
}
