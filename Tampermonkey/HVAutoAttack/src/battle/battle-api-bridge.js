/* global MAIN_URL */
import { cE, gE } from "../dom/query.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import {
  BattleApiResponseRecoveryEvent,
  runBattleApiResponseRecovery,
} from "./battle-api-response-recovery.js";
import { buildApiResponseScript } from "./battle-api-response-script.js";
import { BattleApiWorldContextEvent, runBattleApiWorldContext } from "./battle-api-world-context.js";

const EVENT_INSTALL = "install";
const ACTION_START_EVENT_NODE_ID = "eventStart", ACTION_END_EVENT_NODE_ID = "eventEnd";
const MAGIC_DELAY_SESSION_KEY = "delay";
const ACTION_DELAY_SESSION_KEY = "delay2";
const REASON_API_RECOVERY_INSTALL_FAILED = "apiRecoveryBridgeInstallFailed";

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

function buildApiCallScript(apiJsonUrl, protocol) {
  return `api_call = ${function (b, a, d) {
    const delay = window.sessionStorage.__HVAA_MAGIC_DELAY_SESSION_KEY__ * 1;
    const delay2 = window.sessionStorage.__HVAA_ACTION_DELAY_SESSION_KEY__ * 1;
    const apiJsonUrl = typeof MAIN_URL !== "undefined" ? MAIN_URL + "json" : "__HVAA_MAIN_JSON_URL__";
    window.info = a;
    b.open("POST", apiJsonUrl);
    b.setRequestHeader("Content-Type", "application/json");
    b.withCredentials = true;
    b.onreadystatechange = function () {
      const callbackTarget =
        window.battle && typeof window.battle.battle_continue === "function"
          ? window.battle
          : {
              battle_continue: function () {
                const navigation = window.HVAA_navigation;
                if (navigation && navigation.reloadCurrentPage && navigation.ReloadReason) {
                  return navigation.reloadCurrentPage(
                    navigation.ReloadReason.BATTLE_API_CALLBACK_FALLBACK,
                    { source: "battleApiBridge", reason: "missingBattleContinue" }
                  );
                }
                console.warn("[HVAA] battle API callback fallback reload blocked; navigation bridge missing");
                return false;
              },
            };
      return d.apply(callbackTarget, arguments);
    };
    b.onload = function () {
      document.getElementById("__HVAA_ACTION_END_EVENT_NODE_ID__").click();
    };
    document.getElementById("__HVAA_ACTION_START_EVENT_NODE_ID__").click();
    if (a.mode === "magic" && a.skill >= 200) {
      if (delay <= 0) {
        b.send(JSON.stringify(a));
      } else {
        setTimeout(
          () => {
            b.send(JSON.stringify(a));
          },
          (delay * (Math.random() * 50 + 50)) / 100
        );
      }
    } else if (delay2 <= 0) {
      b.send(JSON.stringify(a));
    } else {
      setTimeout(
        () => {
          b.send(JSON.stringify(a));
        },
        (delay2 * (Math.random() * 50 + 50)) / 100
      );
    }
  }.toString()}`
    .replaceAll("__HVAA_MAIN_JSON_URL__", apiJsonUrl)
    .replaceAll("__HVAA_ACTION_START_EVENT_NODE_ID__", protocol.actionStartEventNodeId)
    .replaceAll("__HVAA_ACTION_END_EVENT_NODE_ID__", protocol.actionEndEventNodeId)
    .replaceAll("__HVAA_MAGIC_DELAY_SESSION_KEY__", protocol.magicDelaySessionKey)
    .replaceAll("__HVAA_ACTION_DELAY_SESSION_KEY__", protocol.actionDelaySessionKey);
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
  writeApiBridgeDelayRuntime(deps, readApiBridgeDelayOption(deps));
  if (!deps.installApiResponseRecovery()) return rejectApiRecoveryBridgeInstallFailed(deps);
  const worldContext = deps.readBattleApiWorldContext();

  const apiCall = deps.createScript();
  apiCall.textContent = buildApiCallScript(worldContext.apiJsonUrl, {
    actionStartEventNodeId: ACTION_START_EVENT_NODE_ID,
    actionEndEventNodeId: ACTION_END_EVENT_NODE_ID,
    magicDelaySessionKey: MAGIC_DELAY_SESSION_KEY,
    actionDelaySessionKey: ACTION_DELAY_SESSION_KEY,
  });
  deps.appendHead(apiCall);

  const apiResponse = deps.createScript();
  apiResponse.textContent = buildApiResponseScript(worldContext);
  deps.appendHead(apiResponse);
  return true;
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
