import { NavigationEvent, NavigationReloadReason, runNavigationAutomation } from "../core/navigate.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { readRecentDiagnosticEvidence } from "../core/diagnostic-evidence.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

const EVENT_INSTALL_BRIDGE = "installBridge";
const EVENT_REJECTED_RESPONSE = "rejectedResponse";
const EVENT_UNKNOWN_API_RECOVERY = "unknownApiResponseRecoveryEvent";
const API_RECOVERY_SESSION_KEY = DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY;
const API_RECOVERY_BRIDGE_NAME = "HVAA_battleApiRecovery";
const REPEAT_PAUSE_THRESHOLD = 2;
const OUTCOME_REJECTED = "rejected";

export const BattleApiResponseRecoveryEvent = Object.freeze({
  INSTALL_BRIDGE: EVENT_INSTALL_BRIDGE,
  REJECTED_RESPONSE: EVENT_REJECTED_RESPONSE,
});

const battleApiResponseRecoveryEventHandlers = Object.freeze({
  [EVENT_INSTALL_BRIDGE]: (event, deps) => installApiRecoveryBridge(event, deps),
  [EVENT_REJECTED_RESPONSE]: (event, deps) => handleRejectedApiResponse(event.detail, deps),
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
  deps.sessionStorage.setItem(API_RECOVERY_SESSION_KEY, JSON.stringify(state));
}

function diagnosticEvidenceWithoutApiRecovery(diagnosticEvidence) {
  if (!diagnosticEvidence) return undefined;
  const { battleApiResponseRecovery: _self, ...rest } = diagnosticEvidence;
  return Object.keys(rest).length ? rest : undefined;
}

function buildRecoveryState(detail, deps) {
  const key = apiFailureKey(detail);
  const previous = readRecoveryState(deps);
  const repeatCount = previous?.key === key ? Number(previous.repeatCount || 1) + 1 : 1;
  const diagnosticEvidence = diagnosticEvidenceWithoutApiRecovery(deps.readDiagnosticEvidence?.());
  return diagnosticEvidence ? { key, repeatCount, detail, diagnosticEvidence } : { key, repeatCount, detail };
}

function handleRejectedApiResponse(detail, deps) {
  const state = buildRecoveryState(detail, deps);
  writeRecoveryState(deps, state);
  if (state.repeatCount >= REPEAT_PAUSE_THRESHOLD) {
    deps.pause(state);
    deps.warn("[HVAA] battle API response repeated; auto battle paused", state);
    return "paused";
  }
  deps.reload(detail);
  return "reload";
}

function rejectUnknownApiRecoveryEvent(event, deps) {
  const detail = {
    outcome: OUTCOME_REJECTED,
    reason: EVENT_UNKNOWN_API_RECOVERY,
    eventType: event?.type ?? null,
  };
  const state = {
    key: apiFailureKey(detail),
    repeatCount: 1,
    detail,
  };
  writeRecoveryState(deps, state);
  return false;
}

function bridgeTargetFrom(event) {
  if (event.target) return event.target;
  return typeof window === "undefined" ? null : window;
}

function installApiRecoveryBridge(event, deps) {
  const bridge = Object.freeze({
    handleRejectedResponse: (detail) =>
      runBattleApiResponseRecovery({ type: EVENT_REJECTED_RESPONSE, detail }, deps),
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
    reload: (detail) =>
      runNavigationAutomation({
        type: NavigationEvent.RELOAD_NOW,
        reason: NavigationReloadReason.BATTLE_API_RESPONSE,
        detail,
      }),
    pause: (state) =>
      runBattlePauseAutomation({
        type: BattlePauseEvent.PAUSE,
        reason: "battleApiResponseRepeated",
        detail: state,
      }),
    readDiagnosticEvidence: () => readRecentDiagnosticEvidence(window.sessionStorage),
    warn: (...args) => console.warn(...args),
  }
) {
  return battleApiResponseRecoveryEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownApiRecoveryEvent(event, deps);
}
