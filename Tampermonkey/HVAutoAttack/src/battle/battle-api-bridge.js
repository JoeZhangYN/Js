/* global MAIN_URL */
import { cE, gE } from "../dom/query.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import {
  BattleApiResponseRecoveryEvent,
  runBattleApiResponseRecovery,
} from "./battle-api-response-recovery.js";
import { buildApiCallScript } from "./battle-api-call-script.js";
import { buildApiResponseScript } from "./battle-api-response-script.js";
import { BattleApiWorldContextEvent, runBattleApiWorldContext } from "./battle-api-world-context.js";

const EVENT_INSTALL = "install";
const ACTION_START_EVENT_NODE_ID = "eventStart", ACTION_END_EVENT_NODE_ID = "eventEnd";
const MAGIC_DELAY_SESSION_KEY = "delay";
const ACTION_DELAY_SESSION_KEY = "delay2";
const REASON_API_RECOVERY_INSTALL_FAILED = "apiRecoveryBridgeInstallFailed";
const REASON_API_BRIDGE_INSTALL_STEP_FAILED = "apiBridgeInstallStepFailed";

export const BattleApiBridgeEvent = Object.freeze({ INSTALL: EVENT_INSTALL });

const battleApiBridgeEventHandlers = Object.freeze({
  [EVENT_INSTALL]: (_event, deps) => installBridge(deps),
});

function rejectUnknownApiBridgeEvent(event, deps) {
  return (
    deps.rejectApiBridgeEvent?.(event ?? null) ??
    runBattleApiResponseRecovery({
      type: BattleApiResponseRecoveryEvent.REJECTED_API_BRIDGE_EVENT,
      detail: { eventType: event?.type ?? null },
    })
  );
}

function rejectApiRecoveryBridgeInstallFailed(deps) {
  const detail = { type: EVENT_INSTALL, reason: REASON_API_RECOVERY_INSTALL_FAILED };
  return (
    deps.rejectApiBridgeEvent?.(detail) ??
    runBattleApiResponseRecovery({
      type: BattleApiResponseRecoveryEvent.REJECTED_API_BRIDGE_EVENT,
      detail: { eventType: EVENT_INSTALL, reason: REASON_API_RECOVERY_INSTALL_FAILED },
    })
  );
}

function rejectApiBridgeInstallStepFailed(deps, step, error) {
  const detail = {
    type: EVENT_INSTALL,
    reason: REASON_API_BRIDGE_INSTALL_STEP_FAILED,
    step,
    error: error?.message || String(error),
  };
  return (
    deps.rejectApiBridgeEvent?.(detail) ??
    runBattleApiResponseRecovery({
      type: BattleApiResponseRecoveryEvent.REJECTED_API_BRIDGE_EVENT,
      detail: {
        eventType: EVENT_INSTALL,
        reason: REASON_API_BRIDGE_INSTALL_STEP_FAILED,
        step,
        error: detail.error,
      },
    })
  );
}

function readApiBridgeDelayOption(deps) {
  return {
    delay: Number(deps.readOptionField(MAGIC_DELAY_SESSION_KEY, 0)) || 0,
    delay2: Number(deps.readOptionField(ACTION_DELAY_SESSION_KEY, 0)) || 0,
  };
}

function writeApiBridgeDelayRuntime(deps, option) {
  deps.sessionStorage[MAGIC_DELAY_SESSION_KEY] = option.delay;
  deps.sessionStorage[ACTION_DELAY_SESSION_KEY] = option.delay2;
}

function installBridge(deps) {
  let step = "readApiBridgeDelayOption";
  try {
    const delayOption = readApiBridgeDelayOption(deps);
    step = "writeApiBridgeDelayRuntime";
    writeApiBridgeDelayRuntime(deps, delayOption);
    step = "installApiResponseRecovery";
    if (!deps.installApiResponseRecovery()) return rejectApiRecoveryBridgeInstallFailed(deps);
    step = "readBattleApiWorldContext";
    const worldContext = deps.readBattleApiWorldContext();

    step = "createApiCallScript";
    const apiCall = deps.createScript();
    apiCall.textContent = buildApiCallScript(worldContext.apiJsonUrl, {
      actionStartEventNodeId: ACTION_START_EVENT_NODE_ID,
      actionEndEventNodeId: ACTION_END_EVENT_NODE_ID,
      magicDelaySessionKey: MAGIC_DELAY_SESSION_KEY,
      actionDelaySessionKey: ACTION_DELAY_SESSION_KEY,
    });
    step = "appendApiCallScript";
    deps.appendHead(apiCall);

    step = "createApiResponseScript";
    const apiResponse = deps.createScript();
    apiResponse.textContent = buildApiResponseScript(worldContext);
    step = "appendApiResponseScript";
    deps.appendHead(apiResponse);
    return true;
  } catch (error) {
    return rejectApiBridgeInstallStepFailed(deps, step, error);
  }
}

export function runBattleApiBridgeAutomation(
  event = { type: EVENT_INSTALL },
  deps = {
    readOptionField: (key, fallback) =>
      runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback }),
    sessionStorage: window.sessionStorage,
    createScript: () => cE("script"),
    appendHead: (script) => gE("head").appendChild(script),
    readBattleApiWorldContext: () =>
      runBattleApiWorldContext({ type: BattleApiWorldContextEvent.READ_CURRENT }),
    installApiResponseRecovery: () =>
      runBattleApiResponseRecovery({ type: BattleApiResponseRecoveryEvent.INSTALL_BRIDGE }),
  }
) {
  return battleApiBridgeEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownApiBridgeEvent(event, deps);
}
