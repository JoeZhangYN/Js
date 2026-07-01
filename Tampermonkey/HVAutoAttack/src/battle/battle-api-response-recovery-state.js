import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export const API_RECOVERY_SESSION_KEY = DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY;

const fallbackRecoveryStates = new WeakMap();

function apiFailureKey(detail) {
  return JSON.stringify({
    responseKind: detail?.responseKind,
    status: detail?.status,
    error: detail?.error,
    parseError: detail?.parseError,
    reload: detail?.reload,
    world: detail?.world,
    action: detail?.action,
  });
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

export function writeRecoveryState(deps, state) {
  try {
    deps.sessionStorage.setItem(
      API_RECOVERY_SESSION_KEY,
      JSON.stringify({ ...state, storageWriteOk: true })
    );
    fallbackRecoveryStates.delete(deps.sessionStorage);
    state.storageWriteOk = true;
    return true;
  } catch (error) {
    state.storageWriteOk = false;
    state.storageWriteError = error?.message || String(error);
    fallbackRecoveryStates.set(deps.sessionStorage, { ...state });
    deps.warn?.("[HVAA] battle API recovery state write failed", state);
    return false;
  }
}

export function recordRecoveryEffectResult(deps, state, resultName, runEffect, errorName) {
  try {
    const result = runEffect();
    state[resultName] = Boolean(result);
  } catch (error) {
    state[resultName] = false;
    state[errorName] = error?.message || String(error);
    deps.warn?.("[HVAA] battle API recovery effect failed", state);
  }
  writeRecoveryState(deps, state);
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
  const key = apiFailureKey(detail);
  const previous = readRecoveryState(deps);
  const repeatCount = previous?.key === key ? Number(previous.repeatCount || 1) + 1 : 1;
  const diagnostics = readRecoveryDiagnosticEvidence(deps);
  return { key, repeatCount, detail, ...diagnostics };
}

export function buildRejectedRecoveryState(detail, deps, recoveryAction) {
  return {
    key: apiFailureKey(detail),
    repeatCount: 1,
    detail,
    recoveryAction,
    ...readRecoveryDiagnosticEvidence(deps),
  };
}
