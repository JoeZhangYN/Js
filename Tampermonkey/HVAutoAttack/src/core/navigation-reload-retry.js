export const RELOAD_RETRY_DELAY_MS = 5000;
export const RELOAD_MAX_ATTEMPTS = 3;
export const CAUSE_RELOAD_RETRY_LIMIT_REACHED = "reloadRetryLimitReached";

export function shouldStopReloadRetry(attempt) {
  return attempt > RELOAD_MAX_ATTEMPTS;
}

export function createReloadEvidence(attempt, detail) {
  return { attempt, retryDelayMs: RELOAD_RETRY_DELAY_MS, detail };
}

export function createReloadAudit(reason, attempt, detail) {
  return { reason, attempt, retryDelayMs: RELOAD_RETRY_DELAY_MS, detail };
}

export function createReloadStopEvidence(attempt, detail) {
  return {
    cause: CAUSE_RELOAD_RETRY_LIMIT_REACHED,
    attempt,
    maxAttempts: RELOAD_MAX_ATTEMPTS,
    detail,
  };
}

export function createReloadStopAudit(reason, attempt, detail) {
  return {
    reason,
    attempt,
    maxAttempts: RELOAD_MAX_ATTEMPTS,
    retryDelayMs: RELOAD_RETRY_DELAY_MS,
    detail,
  };
}

export function createReloadFailureEvidence(cause, attempt, detail, error) {
  return { cause, attempt, detail, error: error?.message || String(error) };
}

export function createReloadFailureAudit(reason, attempt, detail, error) {
  return {
    reason,
    attempt,
    retryDelayMs: RELOAD_RETRY_DELAY_MS,
    detail,
    error: error?.message || String(error),
  };
}
