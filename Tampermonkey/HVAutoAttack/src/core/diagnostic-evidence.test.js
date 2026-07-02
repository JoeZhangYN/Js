import { beforeEach, describe, expect, it } from "vitest";
import { readRecentDiagnosticEvidence } from "./diagnostic-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("readRecentDiagnosticEvidence", () => {
  it("returns lifecycle, decision, and effect evidence together", () => {
    window.sessionStorage.setItem(
      "HVAA:lastNavigationDecision",
      JSON.stringify({ decision: "rejected", detail: { cause: "invalidReloadDelay" } })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleTurnWorkflow",
      JSON.stringify({ stage: "contextPrepared", detail: { hasContext: true } })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleApiBridge",
      JSON.stringify({ phase: "start", result: "rejected", reason: "eventNodeMissing" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleAutomation",
      JSON.stringify({ phase: "pageReady", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleLifecycle",
      JSON.stringify({ phase: "battleStarted", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleCompletion",
      JSON.stringify({ outcome: "victory", effects: { scheduleReload: true } })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleRoundStart",
      JSON.stringify({ phase: "roundStarted", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleKillBugRecovery",
      JSON.stringify({ result: "scheduledReload", detail: { scannedRows: 1 } })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleMonsterStatusRepair",
      JSON.stringify({ result: "scheduledReload", reason: "roundStartLog" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleMonsterKnowledgePersistence",
      JSON.stringify({ result: "failed", stage: "scan-store-profile" })
    );
    window.sessionStorage.setItem(
      "HVAA:battleApiRecovery",
      JSON.stringify({ repeatCount: 2, detail: { responseKind: "jsonReload" } })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleCommand",
      JSON.stringify({ command: "skill.clickReady", result: "rejected", reason: "skillNotReady" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattlePause",
      JSON.stringify({ state: "paused", reason: "autoPause" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionDelay",
      JSON.stringify({ decision: "rejected", reason: "unknownActionDelayEvent" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionSpeed",
      JSON.stringify({ decision: "rejected", reason: "unknownActionSpeedEvent" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionLifecycle",
      JSON.stringify({ phase: "actionStarted", result: true })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionDecision",
      JSON.stringify({
        steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }],
      })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleActionEffect",
      JSON.stringify({ result: { kind: "noop" }, acted: false, knownResultKind: true })
    );
    window.sessionStorage.setItem("HVAA:lastHttpRequestFailure", JSON.stringify({ capability: "httpRequest", stage: "finalFailure", kind: "networkError" }));
    window.sessionStorage.setItem("HVAA:lastStaminaRecoveryFailure", JSON.stringify({ capability: "staminaRecovery", stage: "claimRecoveryPost" }));
    window.sessionStorage.setItem("HVAA:lastRepairBackendFailure", JSON.stringify({ capability: "repairBackend", stage: "requestFailure" }));
    window.sessionStorage.setItem("HVAA:lastMonsterDbStoreFailure", JSON.stringify({ capability: "monsterDbStore", stage: "open" }));
    window.sessionStorage.setItem("HVAA:lastAppStartupFailure", JSON.stringify({ capability: "appStartup", stage: "loadCdRuntimeState" }));
    window.sessionStorage.setItem("HVAA:lastPageAutomationFailure", JSON.stringify({ capability: "pageAutomation", stage: "runGamePageReadyAutomation" }));
    window.sessionStorage.setItem("HVAA:lastPageRefreshFailure", JSON.stringify({ capability: "pageRefresh", stage: "scheduleReload" }));
    window.sessionStorage.setItem("HVAA:lastIdleArenaFailure", JSON.stringify({ capability: "idleArena", stage: "battle-start" }));
    window.sessionStorage.setItem("HVAA:lastStorageReadFailure", JSON.stringify({ capability: "storageRead", source: "GM_getValue" }));

    expect(readRecentDiagnosticEvidence(window.sessionStorage)).toMatchObject({
      navigationDecision: { decision: "rejected", detail: { cause: "invalidReloadDelay" } },
      battleAutomation: { phase: "pageReady", result: true },
      battleLifecycle: { phase: "battleStarted", result: true },
      battleCompletion: { outcome: "victory", effects: { scheduleReload: true } },
      battleRoundStart: { phase: "roundStarted", result: true },
      battleKillBugRecovery: { result: "scheduledReload", detail: { scannedRows: 1 } },
      battleMonsterStatusRepair: { result: "scheduledReload", reason: "roundStartLog" },
      battleMonsterKnowledgePersistence: { result: "failed", stage: "scan-store-profile" },
      battleTurnWorkflow: { stage: "contextPrepared", detail: { hasContext: true } },
      battleApiBridge: { phase: "start", result: "rejected", reason: "eventNodeMissing" },
      battleApiResponseRecovery: { repeatCount: 2, detail: { responseKind: "jsonReload" } },
      battleCommand: { command: "skill.clickReady", result: "rejected", reason: "skillNotReady" },
      battlePause: { state: "paused", reason: "autoPause" },
      battleActionDelay: { decision: "rejected", reason: "unknownActionDelayEvent" },
      battleActionSpeed: { decision: "rejected", reason: "unknownActionSpeedEvent" },
      battleActionLifecycle: { phase: "actionStarted", result: true },
      battleActionDecision: {
        steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }],
      },
      battleActionEffect: { result: { kind: "noop" }, acted: false, knownResultKind: true },
      httpRequestFailure: { capability: "httpRequest", stage: "finalFailure", kind: "networkError" },
      staminaRecoveryFailure: { capability: "staminaRecovery", stage: "claimRecoveryPost" },
      repairBackendFailure: { capability: "repairBackend", stage: "requestFailure" },
      monsterDbStoreFailure: { capability: "monsterDbStore", stage: "open" },
      appStartupFailure: { capability: "appStartup", stage: "loadCdRuntimeState" },
      pageAutomationFailure: { capability: "pageAutomation", stage: "runGamePageReadyAutomation" },
      pageRefreshFailure: { capability: "pageRefresh", stage: "scheduleReload" },
      idleArenaFailure: { capability: "idleArena", stage: "battle-start" },
      storageReadFailure: { capability: "storageRead", source: "GM_getValue" },
    });
  });

  it("skips malformed or unreadable evidence sources without dropping later evidence", () => {
    window.sessionStorage.setItem("HVAA:lastNavigationDecision", "{not-json");
    window.sessionStorage.setItem(
      "HVAA:lastBattleCompletion",
      JSON.stringify({ outcome: "victory", effects: { scheduleReload: false } })
    );
    const blockedKeys = new Set(["HVAA:lastBattleApiBridge"]);
    const storage = {
      getItem(key) {
        if (blockedKeys.has(key)) throw new Error("read blocked");
        return window.sessionStorage.getItem(key);
      },
    };

    expect(readRecentDiagnosticEvidence(storage)).toMatchObject({
      battleCompletion: { outcome: "victory", effects: { scheduleReload: false } },
    });
    expect(readRecentDiagnosticEvidence(storage)).not.toHaveProperty("navigationDecision");
    expect(readRecentDiagnosticEvidence(storage)).not.toHaveProperty("battleApiBridge");
  });
});
