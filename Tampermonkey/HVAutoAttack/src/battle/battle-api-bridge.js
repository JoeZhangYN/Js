import { cE, gE } from "../dom/query.js";
import { MAIN_URL } from "../env.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const EVENT_INSTALL = "install";

export const BattleApiBridgeEvent = Object.freeze({
  INSTALL: EVENT_INSTALL,
});

function buildApiCallScript(mainUrl) {
  return `api_call = ${function (b, a, d) {
    const delay = window.sessionStorage.delay * 1;
    const delay2 = window.sessionStorage.delay2 * 1;
    window.info = a;
    b.open("POST", "__HVAA_MAIN_JSON_URL__");
    b.setRequestHeader("Content-Type", "application/json");
    b.withCredentials = true;
    b.onreadystatechange = d;
    b.onload = function () {
      document.getElementById("eventEnd").click();
    };
    document.getElementById("eventStart").click();
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
  }.toString()}`.replaceAll("__HVAA_MAIN_JSON_URL__", `${mainUrl}json`);
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

function installBridge(deps) {
  const option = deps.readOption();
  deps.sessionStorage.delay = option.delay;
  deps.sessionStorage.delay2 = option.delay2;

  const apiCall = deps.createScript();
  apiCall.textContent = buildApiCallScript(deps.mainUrl);
  deps.appendHead(apiCall);

  const apiResponse = deps.createScript();
  apiResponse.textContent = buildApiResponseScript();
  deps.appendHead(apiResponse);
  return true;
}

export function runBattleApiBridgeAutomation(
  event = { type: EVENT_INSTALL },
  deps = {
    readOption: () => runOptionAutomation({ type: OptionEvent.READ }) || {},
    sessionStorage: window.sessionStorage,
    createScript: () => cE("script"),
    appendHead: (script) => gE("head").appendChild(script),
    mainUrl: MAIN_URL,
  }
) {
  if (event.type === EVENT_INSTALL) return installBridge(deps);
  return false;
}
