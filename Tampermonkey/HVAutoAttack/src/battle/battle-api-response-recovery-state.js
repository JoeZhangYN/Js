import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export const API_RECOVERY_SESSION_KEY = DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY;

const fallbackRecoveryStates = new WeakMap();

function apiFailureKeyParts(detail) {
  return {
    responseKind: detail?.responseKind,
    status: detail?.status,
    error: detail?.error,
    parseError: detail?.parseError,
    reload: detail?.reload,
    world: detail?.world,
    action: detail?.action,
  };
}

function apiFailureKey(detail) {
  try {
    return { key: JSON.stringify(apiFailureKeyParts(detail)) };
  } catch (error) {
    return {
      key: JSON.stringify({
        responseKind: detail?.responseKind,
        status: detail?.status,
        error: detail?.error,
        parseError: detail?.parseError,
        reload: detail?.reload,
        keyFallback: "unserializableApiFailure",
      }),
      apiFailureKeyError: error?.message || String(error),
    };
  }
}

function readRecoveryState(deps) {
  try {
    return (
      JSON.parse(deps.sessionStorage.getItem(API_RECOVERY_SESSION_KEY) || "null") ??
      fallbackRecoveryStates.get(deps.sessionStorage) ??
      null
    );
  } catch (_error) {
    return fallbackRecoveryStates.get(deps.sessionStorage) ?? null;
  }
}

function jsonSafeRecoveryState(state) {
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(state, (_key, value) => {
      if (typeof value === "bigint") return String(value);
      if (!value || typeof value !== "object") return value;
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
      return value;
    })
  );
}

export function writeRecoveryState(deps, state) {
  try {
    deps.sessionStorage.setItem(
      API_RECOVERY_SESSION_KEY,
      JSON.stringify(jsonSafeRecoveryState({ ...state, storageWriteOk: true }))
    );
    fallbackRecoveryStates.delete(deps.sessionStorage);
    state.storageWriteOk = true;
    return true;
  } catch (error) {
    state.storageWriteOk = false;
    state.storageWriteError = error?.message || String(error);
    fallbackRecoveryStates.set(deps.sessionStorage, { ...state });
    warnRecoveryStateSafely(deps, "[HVAA] battle API recovery state write failed", state);
    return false;
  }
}

export function recordRecoveryEffectResult(deps, state, resultName, runEffect, errorName) {
  try {
    const result = runEffect();
    state[resultName] = recoveryEffectSucceeded(result);
  } catch (error) {
    state[resultName] = false;
    state[errorName] = error?.message || String(error);
    warnRecoveryStateSafely(deps, "[HVAA] battle API recovery effect failed", state);
  }
  writeRecoveryState(deps, state);
}

function recoveryEffectSucceeded(result) {
  if (result?.kind === "failed") return false;
  return Boolean(result);
}

export function warnRecoveryStateSafely(deps, message, state) {
  try {
    deps.warn?.(message, state);
  } catch (_error) {
    return false;
  }
  return true;
}

function diagnosticEvidenceWithoutApiRecovery(diagnosticEvidence) {
  if (!diagnosticEvidence) return undefined;
  const { battleApiResponseRecovery: _self, ...rest } = diagnosticEvidence;
  return Object.keys(rest).length ? rest : undefined;
}

function readRecoveryDiagnosticEvidence(deps) {
  try {
    return {
      diagnosticEvidence: diagnosticEvidenceWithoutApiRecovery(deps.readDiagnosticEvidence?.()),
    };
  } catch (error) {
    return { diagnosticEvidenceReadError: error?.message || String(error) };
  }
}

export function buildRecoveryState(detail, deps) {
  const keyEvidence = apiFailureKey(detail);
  const key = keyEvidence.key;
  const previous = readRecoveryState(deps);
  const repeatCount = previous?.key === key ? Number(previous.repeatCount || 1) + 1 : 1;
  const diagnostics = readRecoveryDiagnosticEvidence(deps);
  return { ...keyEvidence, repeatCount, detail, ...diagnostics };
}

export function buildRejectedRecoveryState(detail, deps, recoveryAction) {
  const keyEvidence = apiFailureKey(detail);
  return {
    ...keyEvidence,
    repeatCount: 1,
    detail,
    recoveryAction,
    ...readRecoveryDiagnosticEvidence(deps),
  };
}
