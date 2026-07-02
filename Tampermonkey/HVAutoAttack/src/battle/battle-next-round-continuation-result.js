import { recordContinuationSafely } from "./battle-next-round-continuation-recording.js";

export function recordCallbackRejection(deps, reason, steps, detail) {
  recordContinuationSafely(
    deps,
    { outcome: "rejected", continued: false, reason, ...(detail ? { detail } : {}) },
    steps
  );
}

export function recordPostFailure(deps, reason, steps, failure) {
  steps.push({ step: "postFailure", result: false, failure });
  recordCallbackRejection(deps, reason, steps, failure);
}
