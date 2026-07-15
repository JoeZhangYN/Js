import {
  LearnedMonsterFamily,
  LearnedMonsterStoreEvent,
  runLearnedMonsterStoreAutomation,
} from "./learned-monster-store.js";
import {
  normalizeLegacyBigKillMap,
  normalizeLegacyIncomingBurstMap,
} from "./learned-monster-legacy-normalize.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { StaminaLossStoreEvent, runStaminaLossStoreAutomation } from "./stamina-loss-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";
import { createVerifiedMaintenanceSource, worldStorageKey } from "./storage-maintenance-source.js";

function staminaSource(policy, legacy, deps) {
  const sourceId = "staminaLoss";
  const key = worldStorageKey(policy, STORAGE_KEYS.STAMINA_LOST_LOG);
  const runStore = deps.runStamina || runStaminaLossStoreAutomation;
  const now = deps.now || Date.now;
  return createVerifiedMaintenanceSource({
    sourceId,
    targetIdentity: policy.staminaLoss.dbName,
    readSource: () => legacy.readKey(key),
    normalize: (value) => (value && typeof value === "object" ? value : {}),
    async writeTarget(value) {
      for (const [index, [stamp, amount]] of Object.entries(value).entries()) {
        const result = await runStore({
          type: StaminaLossStoreEvent.APPEND,
          id: `legacy:${sourceId}:${stamp}`,
          stamp,
          amount,
          observedAt: now() + index,
          migrationSourceId: sourceId,
        });
        if (result?.outcome === StorageWriteOutcome.FAILED) throw result.error;
      }
    },
    async readTarget() {
      const records = await runStore({ type: StaminaLossStoreEvent.LIST_RECORDS });
      return Object.fromEntries(
        (records || [])
          .filter((record) => record.migrationSourceId === sourceId)
          .map((record) => [record.stamp, record.amount])
      );
    },
    removeSource: () => legacy.removeKeys([key]),
  });
}

function learnedSource(policy, legacy, family, logicalKey, normalize, deps) {
  const sourceId = `learnedMonster:${family}`;
  const key = worldStorageKey(policy, logicalKey);
  const runStore = deps.runLearned || runLearnedMonsterStoreAutomation;
  return createVerifiedMaintenanceSource({
    sourceId,
    targetIdentity: `${policy.learnedMonster.dbName}:${family}`,
    readSource: () => legacy.readKey(key),
    normalize,
    async writeTarget(value) {
      const existing = await runStore({ type: LearnedMonsterStoreEvent.READ_RECORDS, family });
      if (existing?.outcome === StorageWriteOutcome.FAILED) throw existing.error;
      const incomingIds = new Set(Object.keys(value).map(String));
      const conflict = (existing || []).find(
        (record) => incomingIds.has(String(record.id)) && record.migrationSourceId !== sourceId
      );
      if (conflict) {
        const error = new Error(`learned monster target conflict: ${family}:${conflict.id}`);
        error.recovery = "retainLegacyAndReviewConflict";
        throw error;
      }
      const result = await runStore({
        type: LearnedMonsterStoreEvent.UPSERT_MANY,
        family,
        migrationSourceId: sourceId,
        records: Object.entries(value).map(([id, record]) => ({ id, value: record })),
      });
      if (result?.outcome === StorageWriteOutcome.FAILED) throw result.error;
    },
    async readTarget() {
      const records = await runStore({ type: LearnedMonsterStoreEvent.READ_RECORDS, family });
      if (records?.outcome === StorageWriteOutcome.FAILED) throw records.error;
      return Object.fromEntries(
        (records || [])
          .filter((record) => record.migrationSourceId === sourceId)
          .map((record) => [record.id, record.value])
      );
    },
    removeSource: () => legacy.removeKeys([key]),
  });
}

export function createRecordStorageMaintenanceSources(policy, legacy, deps = {}) {
  return Object.freeze([
    staminaSource(policy, legacy, deps),
    learnedSource(
      policy,
      legacy,
      LearnedMonsterFamily.BIG_KILL,
      STORAGE_KEYS.LEARNED_BIG_KILL,
      normalizeLegacyBigKillMap,
      deps
    ),
    learnedSource(
      policy,
      legacy,
      LearnedMonsterFamily.INCOMING_BURST,
      STORAGE_KEYS.LEARNED_INCOMING_BURST,
      normalizeLegacyIncomingBurstMap,
      deps
    ),
  ]);
}
