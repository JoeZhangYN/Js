import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { readRecentDiagnosticEvidence } from "../core/diagnostic-evidence.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";
import {
  API_RECOVERY_SESSION_KEY,
  buildRecoveryState,
  buildRejectedRecoveryState,
  recordRecoveryEffectResult,
  warnRecoveryStateSafely,
  writeRecoveryState,
} from "./battle-api-response-recovery-state.js";

const EVENT_INSTALL_BRIDGE = "installBridge";
const EVENT_REJECTED_RESPONSE = "rejectedResponse";
const EVENT_REJECTED_API_BRIDGE_EVENT = "rejectedApiBridgeEvent";
const EVENT_UNKNOWN_API_RECOVERY = "unknownApiResponseRecoveryEvent";
const EVENT_UNKNOWN_API_BRIDGE = "unknownApiBridgeEvent";
const REASON_API_RECOVERY_BRIDGE_INSTALL_THREW = "apiRecoveryBridgeInstallThrew";
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

function handleRejectedApiResponse(detail, deps) {
  const state = buildRecoveryState(detail, deps);
  if (state.repeatCount >= REPEAT_PAUSE_THRESHOLD) {
    state.recoveryAction = RECOVERY_ACTION_PAUSE;
    writeRecoveryState(deps, state);
    recordRecoveryEffectResult(deps, state, "pauseResult", () => deps.pause(state), "pauseError");
    warnRecoveryStateSafely(deps, "[HVAA] battle API response repeated; auto battle paused", state);
    return "paused";
  }
  state.recoveryAction = RECOVERY_ACTION_RELOAD;
  writeRecoveryState(deps, state);
  recordRecoveryEffectResult(deps, state, "reloadResult", () => deps.reload(state), "reloadError");
  return RECOVERY_ACTION_RELOAD;
}

function rejectUnknownApiRecoveryEvent(event, deps) {
  const detail = {
    outcome: OUTCOME_REJECTED,
    reason: EVENT_UNKNOWN_API_RECOVERY,
    eventType: event?.type ?? null,
  };
  writeRecoveryState(deps, buildRejectedRecoveryState(detail, deps, RECOVERY_ACTION_REJECTED));
  return false;
}

function rejectApiBridgeEvent(detail, deps) {
  const rejectedDetail = {
    outcome: OUTCOME_REJECTED,
    reason: detail?.reason ?? EVENT_UNKNOWN_API_BRIDGE,
    eventType: detail?.eventType ?? null,
    step: detail?.step,
    error: detail?.error,
    rejectApiBridgeEventError: detail?.rejectApiBridgeEventError,
  };
  writeRecoveryState(
    deps,
    buildRejectedRecoveryState(rejectedDetail, deps, RECOVERY_ACTION_REJECTED)
  );
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
  const targets = [];
  const target = bridgeTargetFrom(event);
  if (target) targets.push({ name: "target", value: target });
  if (event.unsafeTarget) targets.push({ name: "unsafeTarget", value: event.unsafeTarget });
  else if (typeof unsafeWindow !== "undefined")
    targets.push({ name: "unsafeWindow", value: unsafeWindow });
  let installed = false;
  for (const item of targets) {
    try {
      item.value[API_RECOVERY_BRIDGE_NAME] = bridge;
      installed = true;
    } catch (error) {
      rejectApiBridgeEvent(
        {
          eventType: EVENT_INSTALL_BRIDGE,
          reason: REASON_API_RECOVERY_BRIDGE_INSTALL_THREW,
          step: item.name,
          error: error?.message || String(error),
        },
        deps
      );
    }
  }
  return installed;
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
    warn: (...args) =>
      runDiagnosticConsoleAutomation({
        type: DiagnosticConsoleEvent.WARN,
        args,
      }),
  }
) {
  return (
    battleApiResponseRecoveryEventHandlers[event?.type]?.(event, deps) ??
    rejectUnknownApiRecoveryEvent(event, deps)
  );
}
