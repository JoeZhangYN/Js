import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export function buildApiCallScript(apiJsonUrl, protocol) {
  return `api_call = ${function (b, a, d) {
    const delay = window.sessionStorage.__HVAA_MAGIC_DELAY_SESSION_KEY__ * 1;
    const delay2 = window.sessionStorage.__HVAA_ACTION_DELAY_SESSION_KEY__ * 1;
    const apiJsonUrl = typeof MAIN_URL !== "undefined" ? MAIN_URL + "json" : "__HVAA_MAIN_JSON_URL__";
    const apiBridgeEvidenceKey = "__HVAA_BATTLE_API_BRIDGE_EVIDENCE_KEY__";
    function recordApiBridgeEventNode(phase, nodeId, result, detail) {
      const evidence = {
        phase,
        nodeId,
        result,
        reason: result === "accepted" ? "clicked" : detail.reason,
        detail,
        at: new Date().toISOString(),
      };
      try {
        window.sessionStorage.setItem(apiBridgeEvidenceKey, JSON.stringify({ ...evidence, storageWriteOk: true }));
      } catch (error) {
        evidence.storageWriteOk = false;
        evidence.storageWriteError = error && error.message ? error.message : String(error);
        console.warn("[HVAA] battle API bridge event node", evidence);
      }
    }
    function clickActionEventNode(phase, nodeId) {
      const node = document.getElementById(nodeId);
      if (!node) {
        recordApiBridgeEventNode(phase, nodeId, "rejected", { reason: "eventNodeMissing" });
        return false;
      }
      try {
        node.click();
        recordApiBridgeEventNode(phase, nodeId, "accepted", {});
        return true;
      } catch (error) {
        recordApiBridgeEventNode(phase, nodeId, "rejected", {
          reason: "eventNodeClickFailed",
          error: error && error.message ? error.message : String(error),
        });
        return false;
      }
    }
    function recordApiTransportFailure(step, error) {
      recordApiBridgeEventNode("transport", null, "rejected", {
        reason: "apiTransportFailed",
        step,
        error: error && error.message ? error.message : String(error),
      });
    }
    function runApiTransportStep(step, run) {
      try {
        run();
        return true;
      } catch (error) {
        recordApiTransportFailure(step, error);
        return false;
      }
    }
    function sendApiRequest(step) {
      return runApiTransportStep(step, () => b.send(JSON.stringify(a)));
    }
    window.info = a;
    if (!runApiTransportStep("open", () => b.open("POST", apiJsonUrl))) return false;
    if (!runApiTransportStep("setRequestHeader", () => b.setRequestHeader("Content-Type", "application/json"))) return false;
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
      clickActionEventNode("end", "__HVAA_ACTION_END_EVENT_NODE_ID__");
    };
    if (!clickActionEventNode("start", "__HVAA_ACTION_START_EVENT_NODE_ID__")) return false;
    if (a.mode === "magic" && a.skill >= 200) {
      if (delay <= 0) {
        return sendApiRequest("send");
      } else {
        setTimeout(() => sendApiRequest("sendDelayed"), (delay * (Math.random() * 50 + 50)) / 100);
        return true;
      }
    } else if (delay2 <= 0) {
      return sendApiRequest("send");
    } else {
      setTimeout(() => sendApiRequest("sendDelayed"), (delay2 * (Math.random() * 50 + 50)) / 100);
      return true;
    }
  }.toString()}`
    .replaceAll("__HVAA_MAIN_JSON_URL__", apiJsonUrl)
    .replaceAll("__HVAA_BATTLE_API_BRIDGE_EVIDENCE_KEY__", DiagnosticEvidenceKey.BATTLE_API_BRIDGE)
    .replaceAll("__HVAA_ACTION_START_EVENT_NODE_ID__", protocol.actionStartEventNodeId)
    .replaceAll("__HVAA_ACTION_END_EVENT_NODE_ID__", protocol.actionEndEventNodeId)
    .replaceAll("__HVAA_MAGIC_DELAY_SESSION_KEY__", protocol.magicDelaySessionKey)
    .replaceAll("__HVAA_ACTION_DELAY_SESSION_KEY__", protocol.actionDelaySessionKey);
}
