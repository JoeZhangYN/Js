import { NavigationEvent, NavigationReloadReason, runNavigationAutomation } from "../core/navigate.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { readRecentDiagnosticEvidence } from "../core/diagnostic-evidence.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

const EVENT_INSTALL_BRIDGE = "installBridge";
const EVENT_REJECTED_RESPONSE = "rejectedResponse";
const EVENT_REJECTED_API_BRIDGE_EVENT = "rejectedApiBridgeEvent";
const EVENT_UNKNOWN_API_RECOVERY = "unknownApiResponseRecoveryEvent";
const EVENT_UNKNOWN_API_BRIDGE = "unknownApiBridgeEvent";
const API_RECOVERY_SESSION_KEY = DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY;
const API_RECOVERY_BRIDGE_NAME = "HVAA_battleApiRecovery";
const REPEAT_PAUSE_THRESHOLD = 2;
const OUTCOME_REJECTED = "rejected";
const RECOVERY_ACTION_RELOAD = "reload";
const RECOVERY_ACTION_PAUSE = "pause";
const RECOVERY_ACTION_REJECTED = "rejected";

export const BattleApiResponseRecoveryEvent = Object.freeze({
  INSTALL_BRIDGE: EVENT_INSTALL_BRIDGE,
  REJECTED_RESPONSE: EVENT_REJECTED_RESPONSE,
  REJECTED_API_BRIDGE_EVENT: EVENT_REJECTED_API_BRIDGE_EVENT,
});

const battleApiResponseRecoveryEventHandlers = Object.freeze({
  [EVENT_INSTALL_BRIDGE]: (event, deps) => installApiRecoveryBridge(event, deps),
  [EVENT_REJECTED_RESPONSE]: (event, deps) => handleRejectedApiResponse(event.detail, deps),
  [EVENT_REJECTED_API_BRIDGE_EVENT]: (event, deps) => rejectApiBridgeEvent(event.detail, deps),
});

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
    return JSON.parse(deps.sessionStorage.getItem(API_RECOVERY_SESSION_KEY) || "null");
  } catch (_error) {
    return null;
  }
}

function writeRecoveryState(deps, state) {
  try {
    deps.sessionStorage.setItem(API_RECOVERY_SESSION_KEY, JSON.stringify({ ...state, storageWriteOk: true }));
    state.storageWriteOk = true;
    return true;
  } catch (error) {
    state.storageWriteOk = false;
    state.storageWriteError = error?.message || String(error);
    deps.warn?.("[HVAA] battle API recovery state write failed", state);
    return false;
  }
}

function recordRecoveryEffectResult(deps, state, resultName, runEffect, errorName) {
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
    return { diagnosticEvidence: diagnosticEvidenceWithoutApiRecovery(deps.readDiagnosticEvidence?.()) };
  } catch (error) {
    return { diagnosticEvidenceReadError: error?.message || String(error) };
  }
}

function buildRecoveryState(detail, deps) {
  const key = apiFailureKey(detail);
  const previous = readRecoveryState(deps);
  const repeatCount = previous?.key === key ? Number(previous.repeatCount || 1) + 1 : 1;
  const diagnostics = readRecoveryDiagnosticEvidence(deps);
  return { key, repeatCount, detail, ...diagnostics };
}

function handleRejectedApiResponse(detail, deps) {
  const state = buildRecoveryState(detail, deps);
  if (state.repeatCount >= REPEAT_PAUSE_THRESHOLD) {
    state.recoveryAction = RECOVERY_ACTION_PAUSE;
    writeRecoveryState(deps, state);
    recordRecoveryEffectResult(deps, state, "pauseResult", () => deps.pause(state), "pauseError");
    deps.warn?.("[HVAA] battle API response repeated; auto battle paused", state);
    return "paused";
  }
  state.recoveryAction = RECOVERY_ACTION_RELOAD;
  writeRecoveryState(deps, state);
  recordRecoveryEffectResult(deps, state, "reloadResult", () => deps.reload(state), "reloadError");
  return RECOVERY_ACTION_RELOAD;
}

function buildRejectedRecoveryState(detail, deps) {
  return {
    key: apiFailureKey(detail),
    repeatCount: 1,
    detail,
    recoveryAction: RECOVERY_ACTION_REJECTED,
    ...readRecoveryDiagnosticEvidence(deps),
  };
}

function rejectUnknownApiRecoveryEvent(event, deps) {
  const detail = { outcome: OUTCOME_REJECTED, reason: EVENT_UNKNOWN_API_RECOVERY, eventType: event?.type ?? null };
  writeRecoveryState(deps, buildRejectedRecoveryState(detail, deps));
  return false;
}

function rejectApiBridgeEvent(detail, deps) {
  const rejectedDetail = { outcome: OUTCOME_REJECTED, reason: detail?.reason ?? EVENT_UNKNOWN_API_BRIDGE, eventType: detail?.eventType ?? null };
  writeRecoveryState(deps, buildRejectedRecoveryState(rejectedDetail, deps));
  return false;
}

function bridgeTargetFrom(event) {
  if (event.target) return event.target;
  return typeof window === "undefined" ? null : window;
}

function installApiRecoveryBridge(event, deps) {
  const bridge = Object.freeze({
    handleRejectedResponse: (detail) => runBattleApiResponseRecovery({ type: EVENT_REJECTED_RESPONSE, detail }, deps),
  });
  const target = bridgeTargetFrom(event);
  if (target) target[API_RECOVERY_BRIDGE_NAME] = bridge;
  if (event.unsafeTarget) event.unsafeTarget[API_RECOVERY_BRIDGE_NAME] = bridge;
  else if (typeof unsafeWindow !== "undefined") unsafeWindow[API_RECOVERY_BRIDGE_NAME] = bridge;
  return Boolean(target || event.unsafeTarget || typeof unsafeWindow !== "undefined");
}

export function runBattleApiResponseRecovery(
  event = { type: EVENT_INSTALL_BRIDGE },
  deps = {
    sessionStorage: window.sessionStorage,
    reload: (detail) => runNavigationAutomation({
      type: NavigationEvent.RELOAD_NOW, reason: NavigationReloadReason.BATTLE_API_RESPONSE, detail,
    }),
    pause: (state) => runBattlePauseAutomation({
      type: BattlePauseEvent.PAUSE, reason: "battleApiResponseRepeated", detail: state,
    }),
    readDiagnosticEvidence: () => readRecentDiagnosticEvidence(window.sessionStorage),
    warn: (...args) => console.warn(...args),
  }
) {
  return battleApiResponseRecoveryEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownApiRecoveryEvent(event, deps);
}
