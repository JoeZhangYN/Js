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
      "HVAA:lastBattleRoundFailure": { capability: "battleRound", stage: "record-count-all" },
      "HVAA:lastBattleKillBugRecovery": { result: "scheduledReload", detail: { scannedRows: 1 } },
      "HVAA:lastBattleMonsterStatusRepair": { result: "scheduledReload", reason: "roundStartLog" },
      "HVAA:lastMonsterStatusFailure": { capability: "monsterStatus", stage: "spawn-roster" },
      "HVAA:lastBattleMonsterKnowledgePersistence": { result: "failed", stage: "scan-store-profile" },
      "HVAA:battleApiRecovery": { repeatCount: 2, detail: { responseKind: "jsonReload" } },
      "HVAA:lastBattleCommand": { command: "skill.clickReady", result: "rejected", reason: "skillNotReady" },
      "HVAA:lastBattleRuntimeFailure": { capability: "battleRuntime", stage: "clear-session" },
      "HVAA:lastBattlePause": { state: "paused", reason: "autoPause" },
      "HVAA:lastBattleActionDelay": { decision: "rejected", reason: "unknownActionDelayEvent" },
      "HVAA:lastBattleActionSpeed": { decision: "rejected", reason: "unknownActionSpeedEvent" },
      "HVAA:lastBattleActionLifecycle": { phase: "actionStarted", result: true },
      "HVAA:lastBattleActionDecision": { steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }] },
      "HVAA:lastBattleActionEffect": { result: { kind: "noop" }, acted: false, knownResultKind: true }, "HVAA:lastBattleActionUsageCaptureFailure": { capability: "battleActionUsageCapture", stage: "action-end-log" },
      "HVAA:lastHttpRequestFailure": { capability: "httpRequest", stage: "finalFailure", kind: "networkError" },
      "HVAA:lastStaminaRecoveryFailure": { capability: "staminaRecovery", stage: "claimRecoveryPost" },
      "HVAA:lastRepairBackendFailure": { capability: "repairBackend", stage: "requestFailure" },
      "HVAA:lastMonsterDbStoreFailure": { capability: "monsterDbStore", stage: "open" },
      "HVAA:lastAppStartupFailure": { capability: "appStartup", stage: "loadCdRuntimeState" },
      "HVAA:lastPageAutomationFailure": { capability: "pageAutomation", stage: "runGamePageReadyAutomation" },
      "HVAA:lastPageRefreshFailure": { capability: "pageRefresh", stage: "scheduleReload" },
      "HVAA:lastAbilityAoeFailure": { capability: "abilityAoe", stage: "persist-spell-aoe" },
      "HVAA:lastCrossSiteEncounterFailure": { capability: "crossSiteEncounter", stage: "persist-return-origin" },
      "HVAA:lastIdleArenaFailure": { capability: "idleArena", stage: "battle-start" },
      "HVAA:lastCdRuntimeFailure": { capability: "cdRuntime", stage: "persist" },
      "HVAA:lastAutoTuneFailure": { capability: "autoTune", stage: "record-history" },
      "HVAA:lastRecoveryLearningFailure": { capability: "recoveryLearning", stage: "update-learned" },
      "HVAA:lastCdLearningFailure": { capability: "cdLearning", stage: "update-learned" },
      "HVAA:lastBigSkillKillLearningFailure": { capability: "bigSkillKillLearning", stage: "update-learned" },
      "HVAA:lastIncomingBurstLearningFailure": { capability: "incomingBurstLearning", stage: "update-learned" },
      "HVAA:lastRiddleLogFailure": { capability: "riddleLog", stage: "persist" },
      "HVAA:lastRiddleStatsFailure": { capability: "riddleStats", stage: "record-detail" },
      "HVAA:lastRiddleSubmitFailure": { capability: "riddleSubmit", stage: "click-submit" }, "HVAA:lastRiddleImageFailure": { capability: "riddleImage", stage: "prepare-ml-payload" },
      "HVAA:lastStaminaLossLogFailure": { capability: "staminaLossLog", stage: "record" },
      "HVAA:lastOptionFailure": { capability: "option", stage: "write" },
      "HVAA:lastBattleRecordArchiveFailure": { capability: "battleRecordArchive", stage: "store-current" },
      "HVAA:lastStorageReadFailure": { capability: "storageRead", source: "GM_getValue" },
      "HVAA:lastOptionBackupFailure": { capability: "optionBackup", action: "restore", reason: "restoreFailed" },
      "HVAA:lastRiddleDatasetFailure": { capability: "riddleDataset", stage: "export-list" },
      "HVAA:lastI18nInitFailure": { capability: "i18nInit", entry: "interface" },
      "HVAA:lastI18nRestoreFailure": { capability: "i18nRestore", stage: "restore" },
      "HVAA:lastEncounterStateFailure": { capability: "encounterState", stage: "read-local-json" },
      "HVAA:lastRiddleMlHealthFailure": { capability: "riddleMlHealth", stage: "healthCycle" },
      "HVAA:lastRiddleMlAnswerFailure": { capability: "riddleMlAnswer", stage: "request", fallback: "random" },
      "HVAA:lastEquipmentPercentileFailure": { capability: "equipmentPercentile", stage: "persist-preference" },
      "HVAA:lastEquipmentFilterFailure": { capability: "equipmentFilter", stage: "match" },
      "HVAA:lastHvutNavigationBridgeFailure": { capability: "hvutNavigationBridge", stage: "reloadBlocked" }, "HVAA:lastHvutConfigStorageFailure": { capability: "hvutConfigStorage", stage: "set" }, "HVAA:lastHvutConfigParseFailure": { capability: "hvutConfigParse", stage: "configSeason" }, "HVAA:lastHvutItemShopParseFailure": { capability: "hvutItemShopParse", stage: "systemShopRow" }, "HVAA:lastHvutTopLevelParseFailure": { capability: "hvutTopLevelParse", stage: "topLevelDetails" }, "HVAA:lastHvutAbilityParseFailure": { capability: "hvutAbilityParse", stage: "abilityButtonType" }, "HVAA:lastHvutAbilityUnlockFailure": { capability: "hvutAbilityUnlock", stage: "abilityUnlockRequest" }, "HVAA:lastHvutTrainingNotificationFailure": { capability: "hvutTrainingNotification", stage: "bottomTrainingHtmlEndTime" }, "HVAA:lastHvutMoogleMailParseFailure": { capability: "hvutMoogleMailParse", stage: "viewCurrentCod" }, "HVAA:lastHvutMonsterLabParseFailure": { capability: "hvutMonsterLabParse", stage: "upgradeChaosTokenCost" }, "HVAA:lastHvutMonsterLabUpgradeFailure": { capability: "hvutMonsterLabUpgrade", stage: "upgradeUpdateRequest" }, "HVAA:lastHvutPlayerStateParseFailure": { capability: "hvutPlayerStateParse", stage: "mainPlayerState" }, "HVAA:lastHvutShrineCapacityFailure": { capability: "hvutShrineCapacity", stage: "shrineInventoryCapacity" }, "HVAA:lastHvutShrineRewardParseFailure": { capability: "hvutShrineRewardParse", stage: "rewardSelectButton" }, "HVAA:lastHvutShrineItemParseFailure": { capability: "hvutShrineItemParse", stage: "offerItemRow" }, "HVAA:lastHvutShrineOfferFailure": { capability: "hvutShrineOffer", stage: "offerLoadFetch" }, "HVAA:lastHvutRandomEncounterFailure": { capability: "hvutRandomEncounter", stage: "widgetNewsLoadFetch" }, "HVAA:lastHvutPriceMarketParseFailure": { capability: "hvutPriceMarketParse", stage: "marketItemId" }, "HVAA:lastHvutCharacterParseFailure": { capability: "hvutCharacterParse", stage: "personaEquipSetState" },
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
      battleRoundFailure: { capability: "battleRound", stage: "record-count-all" },
      battleKillBugRecovery: { result: "scheduledReload", detail: { scannedRows: 1 } },
      battleMonsterStatusRepair: { result: "scheduledReload", reason: "roundStartLog" },
      monsterStatusFailure: { capability: "monsterStatus", stage: "spawn-roster" },
      battleMonsterKnowledgePersistence: { result: "failed", stage: "scan-store-profile" },
      battleTurnWorkflow: { stage: "contextPrepared", detail: { hasContext: true } },
      battleApiBridge: { phase: "start", result: "rejected", reason: "eventNodeMissing" },
      battleApiResponseRecovery: { repeatCount: 2, detail: { responseKind: "jsonReload" } },
      battleCommand: { command: "skill.clickReady", result: "rejected", reason: "skillNotReady" },
      battleRuntimeFailure: { capability: "battleRuntime", stage: "clear-session" },
      battlePause: { state: "paused", reason: "autoPause" },
      battleActionDelay: { decision: "rejected", reason: "unknownActionDelayEvent" },
      battleActionSpeed: { decision: "rejected", reason: "unknownActionSpeedEvent" },
      battleActionLifecycle: { phase: "actionStarted", result: true },
      battleActionDecision: { steps: [{ capability: "attack", acted: false, effect: { knownResultKind: true } }] },
      battleActionEffect: { result: { kind: "noop" }, acted: false, knownResultKind: true }, battleActionUsageCaptureFailure: { capability: "battleActionUsageCapture", stage: "action-end-log" },
      httpRequestFailure: { capability: "httpRequest", stage: "finalFailure", kind: "networkError" },
      staminaRecoveryFailure: { capability: "staminaRecovery", stage: "claimRecoveryPost" },
      repairBackendFailure: { capability: "repairBackend", stage: "requestFailure" },
      monsterDbStoreFailure: { capability: "monsterDbStore", stage: "open" },
      appStartupFailure: { capability: "appStartup", stage: "loadCdRuntimeState" },
      pageAutomationFailure: { capability: "pageAutomation", stage: "runGamePageReadyAutomation" },
      pageRefreshFailure: { capability: "pageRefresh", stage: "scheduleReload" },
      abilityAoeFailure: { capability: "abilityAoe", stage: "persist-spell-aoe" },
      crossSiteEncounterFailure: { capability: "crossSiteEncounter", stage: "persist-return-origin" },
      idleArenaFailure: { capability: "idleArena", stage: "battle-start" },
      cdRuntimeFailure: { capability: "cdRuntime", stage: "persist" },
      autoTuneFailure: { capability: "autoTune", stage: "record-history" },
      recoveryLearningFailure: { capability: "recoveryLearning", stage: "update-learned" },
      cdLearningFailure: { capability: "cdLearning", stage: "update-learned" },
      bigSkillKillLearningFailure: { capability: "bigSkillKillLearning", stage: "update-learned" },
      incomingBurstLearningFailure: { capability: "incomingBurstLearning", stage: "update-learned" },
      riddleLogFailure: { capability: "riddleLog", stage: "persist" },
      riddleStatsFailure: { capability: "riddleStats", stage: "record-detail" },
      riddleSubmitFailure: { capability: "riddleSubmit", stage: "click-submit" },
      riddleImageFailure: { capability: "riddleImage", stage: "prepare-ml-payload" },
      staminaLossLogFailure: { capability: "staminaLossLog", stage: "record" },
      optionFailure: { capability: "option", stage: "write" },
      battleRecordArchiveFailure: { capability: "battleRecordArchive", stage: "store-current" },
      storageReadFailure: { capability: "storageRead", source: "GM_getValue" },
      optionBackupFailure: { capability: "optionBackup", action: "restore", reason: "restoreFailed" },
      riddleDatasetFailure: { capability: "riddleDataset", stage: "export-list" },
      i18nInitFailure: { capability: "i18nInit", entry: "interface" },
      i18nRestoreFailure: { capability: "i18nRestore", stage: "restore" },
      encounterStateFailure: { capability: "encounterState", stage: "read-local-json" },
      riddleMlHealthFailure: { capability: "riddleMlHealth", stage: "healthCycle" },
      riddleMlAnswerFailure: { capability: "riddleMlAnswer", stage: "request", fallback: "random" },
      equipmentPercentileFailure: { capability: "equipmentPercentile", stage: "persist-preference" },
      equipmentFilterFailure: { capability: "equipmentFilter", stage: "match" },
      hvutNavigationBridgeFailure: { capability: "hvutNavigationBridge", stage: "reloadBlocked" }, hvutConfigStorageFailure: { capability: "hvutConfigStorage", stage: "set" }, hvutTopLevelParseFailure: { capability: "hvutTopLevelParse", stage: "topLevelDetails" }, hvutAbilityParseFailure: { capability: "hvutAbilityParse", stage: "abilityButtonType" }, hvutAbilityUnlockFailure: { capability: "hvutAbilityUnlock", stage: "abilityUnlockRequest" }, hvutTrainingNotificationFailure: { capability: "hvutTrainingNotification", stage: "bottomTrainingHtmlEndTime" }, hvutMoogleMailParseFailure: { capability: "hvutMoogleMailParse", stage: "viewCurrentCod" }, hvutMonsterLabParseFailure: { capability: "hvutMonsterLabParse", stage: "upgradeChaosTokenCost" }, hvutMonsterLabUpgradeFailure: { capability: "hvutMonsterLabUpgrade", stage: "upgradeUpdateRequest" }, hvutPlayerStateParseFailure: { capability: "hvutPlayerStateParse", stage: "mainPlayerState" }, hvutShrineCapacityFailure: { capability: "hvutShrineCapacity", stage: "shrineInventoryCapacity" }, hvutShrineRewardParseFailure: { capability: "hvutShrineRewardParse", stage: "rewardSelectButton" }, hvutShrineItemParseFailure: { capability: "hvutShrineItemParse", stage: "offerItemRow" }, hvutRandomEncounterFailure: { capability: "hvutRandomEncounter", stage: "widgetNewsLoadFetch" }, hvutPriceMarketParseFailure: { capability: "hvutPriceMarketParse", stage: "marketItemId" }, hvutCharacterParseFailure: { capability: "hvutCharacterParse", stage: "personaEquipSetState" },
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
    window.sessionStorage.setItem("HVAA:lastNavigationAudit", JSON.stringify({ kind: "previousReload" }));
    window.sessionStorage.setItem("HVAA:lastBattleCompletion", JSON.stringify({ outcome: "victory" }));

    expect(readRecentDiagnosticEvidence(window.sessionStorage, { excludeKeys: ["HVAA:lastNavigationAudit"] })).toEqual({
      battleCompletion: { outcome: "victory" },
    });
  });
});
