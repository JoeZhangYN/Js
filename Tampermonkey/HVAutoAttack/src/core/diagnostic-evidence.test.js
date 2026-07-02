import { beforeEach, describe, expect, it } from "vitest";
import { readRecentDiagnosticEvidence } from "./diagnostic-evidence.js";

beforeEach(() => window.sessionStorage.clear());

describe("readRecentDiagnosticEvidence", () => {
  it("returns lifecycle, decision, and effect evidence together", () => {
    const evidenceByKey = {
      "HVAA:lastNavigationAudit": { kind: "reloadNow", reason: "battleApiResponse" },
      "HVAA:lastNavigationDecision": { decision: "rejected", detail: { cause: "invalidReloadDelay" } },
      "HVAA:lastBattleTurnWorkflow": { stage: "contextPrepared", detail: { hasContext: true } },
      "HVAA:lastBattleApiBridge": { phase: "start", result: "rejected", reason: "eventNodeMissing" },
      "HVAA:lastBattleAutomation": { phase: "pageReady", result: true },
      "HVAA:lastBattleLifecycle": { phase: "battleStarted", result: true },
      "HVAA:lastBattleCompletion": { outcome: "victory", effects: { scheduleReload: true } },
      "HVAA:lastBattleRoundStart": { phase: "roundStarted", result: true },
      "HVAA:lastBattleKillBugRecovery": { result: "scheduledReload", detail: { scannedRows: 1 } },
      "HVAA:lastBattleMonsterStatusRepair": { result: "scheduledReload", reason: "roundStartLog" },
      "HVAA:lastBattleMonsterKnowledgePersistence": { result: "failed", stage: "scan-store-profile" },
      "HVAA:battleApiRecovery": { repeatCount: 2, detail: { responseKind: "jsonReload" } },
      "HVAA:lastBattleCommand": { command: "skill.clickReady", result: "rejected", reason: "skillNotReady" },
      "HVAA:lastBattlePause": { state: "paused", reason: "autoPause" },
      "HVAA:lastBattleActionDelay": { decision: "rejected", reason: "unknownActionDelayEvent" },
      "HVAA:lastBattleActionSpeed": { decision: "rejected", reason: "unknownActionSpeedEvent" },
      "HVAA:lastBattleActionLifecycle": { phase: "actionStarted", result: true },
      "HVAA:lastBattleActionDecision": { steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }] },
      "HVAA:lastBattleActionEffect": { result: { kind: "noop" }, acted: false, knownResultKind: true },
      "HVAA:lastHttpRequestFailure": { capability: "httpRequest", stage: "finalFailure", kind: "networkError" },
      "HVAA:lastStaminaRecoveryFailure": { capability: "staminaRecovery", stage: "claimRecoveryPost" },
      "HVAA:lastRepairBackendFailure": { capability: "repairBackend", stage: "requestFailure" },
      "HVAA:lastMonsterDbStoreFailure": { capability: "monsterDbStore", stage: "open" },
      "HVAA:lastAppStartupFailure": { capability: "appStartup", stage: "loadCdRuntimeState" },
      "HVAA:lastPageAutomationFailure": { capability: "pageAutomation", stage: "runGamePageReadyAutomation" },
      "HVAA:lastPageRefreshFailure": { capability: "pageRefresh", stage: "scheduleReload" },
      "HVAA:lastIdleArenaFailure": { capability: "idleArena", stage: "battle-start" },
      "HVAA:lastCdRuntimeFailure": { capability: "cdRuntime", stage: "persist" },
      "HVAA:lastAutoTuneFailure": { capability: "autoTune", stage: "record-history" },
      "HVAA:lastRecoveryLearningFailure": { capability: "recoveryLearning", stage: "update-learned" },
      "HVAA:lastCdLearningFailure": { capability: "cdLearning", stage: "update-learned" },
      "HVAA:lastBigSkillKillLearningFailure": { capability: "bigSkillKillLearning", stage: "update-learned" },
      "HVAA:lastIncomingBurstLearningFailure": { capability: "incomingBurstLearning", stage: "update-learned" },
      "HVAA:lastRiddleLogFailure": { capability: "riddleLog", stage: "persist" },
      "HVAA:lastRiddleStatsFailure": { capability: "riddleStats", stage: "record-detail" },
      "HVAA:lastStorageReadFailure": { capability: "storageRead", source: "GM_getValue" },
      "HVAA:lastOptionBackupFailure": { capability: "optionBackup", action: "restore", reason: "restoreFailed" },
      "HVAA:lastRiddleDatasetFailure": { capability: "riddleDataset", stage: "export-list" },
      "HVAA:lastI18nInitFailure": { capability: "i18nInit", entry: "interface" },
      "HVAA:lastI18nRestoreFailure": { capability: "i18nRestore", stage: "restore" },
      "HVAA:lastEncounterStateFailure": { capability: "encounterState", stage: "read-local-json" },
      "HVAA:lastRiddleMlHealthFailure": { capability: "riddleMlHealth", stage: "healthCycle" },
      "HVAA:lastRiddleMlAnswerFailure": { capability: "riddleMlAnswer", stage: "request", fallback: "random" },
      "HVAA:lastEquipmentFilterFailure": { capability: "equipmentFilter", stage: "match" },
      "HVAA:lastHvutNavigationBridgeFailure": { capability: "hvutNavigationBridge", stage: "reloadBlocked" },
      "HVAA:lastLotteryNotificationFailure": { capability: "lotteryNotification", stage: "load" },
    };
    for (const [key, evidence] of Object.entries(evidenceByKey)) {
      window.sessionStorage.setItem(key, JSON.stringify(evidence));
    }

    expect(readRecentDiagnosticEvidence(window.sessionStorage)).toMatchObject({
      navigationAudit: { kind: "reloadNow", reason: "battleApiResponse" },
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
      battleActionDecision: { steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }] },
      battleActionEffect: { result: { kind: "noop" }, acted: false, knownResultKind: true },
      httpRequestFailure: { capability: "httpRequest", stage: "finalFailure", kind: "networkError" },
      staminaRecoveryFailure: { capability: "staminaRecovery", stage: "claimRecoveryPost" },
      repairBackendFailure: { capability: "repairBackend", stage: "requestFailure" },
      monsterDbStoreFailure: { capability: "monsterDbStore", stage: "open" },
      appStartupFailure: { capability: "appStartup", stage: "loadCdRuntimeState" },
      pageAutomationFailure: { capability: "pageAutomation", stage: "runGamePageReadyAutomation" },
      pageRefreshFailure: { capability: "pageRefresh", stage: "scheduleReload" },
      idleArenaFailure: { capability: "idleArena", stage: "battle-start" },
      cdRuntimeFailure: { capability: "cdRuntime", stage: "persist" },
      autoTuneFailure: { capability: "autoTune", stage: "record-history" },
      recoveryLearningFailure: { capability: "recoveryLearning", stage: "update-learned" },
      cdLearningFailure: { capability: "cdLearning", stage: "update-learned" },
      bigSkillKillLearningFailure: { capability: "bigSkillKillLearning", stage: "update-learned" },
      incomingBurstLearningFailure: { capability: "incomingBurstLearning", stage: "update-learned" },
      riddleLogFailure: { capability: "riddleLog", stage: "persist" },
      riddleStatsFailure: { capability: "riddleStats", stage: "record-detail" },
      storageReadFailure: { capability: "storageRead", source: "GM_getValue" },
      optionBackupFailure: { capability: "optionBackup", action: "restore", reason: "restoreFailed" },
      riddleDatasetFailure: { capability: "riddleDataset", stage: "export-list" },
      i18nInitFailure: { capability: "i18nInit", entry: "interface" },
      i18nRestoreFailure: { capability: "i18nRestore", stage: "restore" },
      encounterStateFailure: { capability: "encounterState", stage: "read-local-json" },
      riddleMlHealthFailure: { capability: "riddleMlHealth", stage: "healthCycle" },
      riddleMlAnswerFailure: { capability: "riddleMlAnswer", stage: "request", fallback: "random" },
      equipmentFilterFailure: { capability: "equipmentFilter", stage: "match" },
      hvutNavigationBridgeFailure: { capability: "hvutNavigationBridge", stage: "reloadBlocked" },
      lotteryNotificationFailure: { capability: "lotteryNotification", stage: "load" },
    });
  });

  it("skips malformed or unreadable evidence sources without dropping later evidence", () => {
    window.sessionStorage.setItem("HVAA:lastNavigationDecision", "{not-json");
    window.sessionStorage.setItem("HVAA:lastBattleCompletion", JSON.stringify({ outcome: "victory", effects: { scheduleReload: false } }));
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

  it("can exclude a diagnostic source for self-recording evidence", () => {
    window.sessionStorage.setItem(
      "HVAA:lastNavigationAudit",
      JSON.stringify({ kind: "previousReload" })
    );
    window.sessionStorage.setItem(
      "HVAA:lastBattleCompletion",
      JSON.stringify({ outcome: "victory" })
    );

    expect(
      readRecentDiagnosticEvidence(window.sessionStorage, {
        excludeKeys: ["HVAA:lastNavigationAudit"],
      })
    ).toEqual({
      battleCompletion: { outcome: "victory" },
    });
  });
});
