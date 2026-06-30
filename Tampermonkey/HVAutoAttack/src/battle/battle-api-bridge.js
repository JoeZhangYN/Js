import { cE, gE } from "../dom/query.js";
import { MAIN_URL } from "../env.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const EVENT_INSTALL = "install";
const ACTION_START_EVENT_NODE_ID = "eventStart";
const ACTION_END_EVENT_NODE_ID = "eventEnd";
const MAGIC_DELAY_SESSION_KEY = "delay";
const ACTION_DELAY_SESSION_KEY = "delay2";

export const BattleApiBridgeEvent = Object.freeze({
  INSTALL: EVENT_INSTALL,
});

const battleApiBridgeEventHandlers = Object.freeze({
  [EVENT_INSTALL]: (event, deps) => installBridge(deps),
});

function buildApiCallScript(mainUrl, protocol) {
  return `api_call = ${function (b, a, d) {
    const delay = window.sessionStorage.__HVAA_MAGIC_DELAY_SESSION_KEY__ * 1;
    const delay2 = window.sessionStorage.__HVAA_ACTION_DELAY_SESSION_KEY__ * 1;
    window.info = a;
    b.open("POST", "__HVAA_MAIN_JSON_URL__");
    b.setRequestHeader("Content-Type", "application/json");
    b.withCredentials = true;
    b.onreadystatechange = d;
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
    .replaceAll("__HVAA_MAIN_JSON_URL__", `${mainUrl}json`)
    .replaceAll("__HVAA_ACTION_START_EVENT_NODE_ID__", protocol.actionStartEventNodeId)
    .replaceAll("__HVAA_ACTION_END_EVENT_NODE_ID__", protocol.actionEndEventNodeId)
    .replaceAll("__HVAA_MAGIC_DELAY_SESSION_KEY__", protocol.magicDelaySessionKey)
    .replaceAll("__HVAA_ACTION_DELAY_SESSION_KEY__", protocol.actionDelaySessionKey);
}

function buildApiResponseScript() {
  return `api_response = ${function (b) {
    if (b.readyState === 4) {
      if (b.status === 200) {
        const a = JSON.parse(b.responseText);
        if (a.login !== undefined) {
          //top.window.location.href = login_url;  // 修改后，不知道什么功能
        } else {
          if (a.error || a.reload) window.location.href = window.location.search;
          return a;
        }
      } else {
        window.location.href = window.location.search;
      }
    }
    return false;
  }.toString()}`;
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

  const apiCall = deps.createScript();
  apiCall.textContent = buildApiCallScript(deps.mainUrl, {
    actionStartEventNodeId: ACTION_START_EVENT_NODE_ID,
    actionEndEventNodeId: ACTION_END_EVENT_NODE_ID,
    magicDelaySessionKey: MAGIC_DELAY_SESSION_KEY,
    actionDelaySessionKey: ACTION_DELAY_SESSION_KEY,
  });
  deps.appendHead(apiCall);

  const apiResponse = deps.createScript();
  apiResponse.textContent = buildApiResponseScript();
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
    mainUrl: MAIN_URL,
  }
) {
  return battleApiBridgeEventHandlers[event.type]?.(event, deps) ?? false;
}
