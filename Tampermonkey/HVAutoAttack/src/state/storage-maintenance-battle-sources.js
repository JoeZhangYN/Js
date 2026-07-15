import {
  BattleReportFamily,
  BattleReportHistoryEvent,
  runBattleReportHistoryAutomation,
} from "../monitor/battle-report-history.js";
import {
  BattleSessionCheckpointEvent,
  BattleSessionCheckpointSlice,
  runBattleSessionCheckpointAutomation,
} from "./battle-session-checkpoint.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";
import { createVerifiedMaintenanceSource, worldStorageKey } from "./storage-maintenance-source.js";
import { storageMaintenanceValueHash } from "./storage-maintenance-value.js";

function historySource(policy, legacy, family, logicalKey, deps) {
  const sourceId = `battleHistory:${family}`;
  const key = worldStorageKey(policy, logicalKey);
  const runHistory = deps.runHistory || runBattleReportHistoryAutomation;
  return createVerifiedMaintenanceSource({
    sourceId,
    targetIdentity: `${policy.battleReport.dbName}:${family}`,
    readSource: () => legacy.readKey(key),
    normalize: (value) => (Array.isArray(value) ? value : []),
    async writeTarget(records) {
      for (const [index, record] of records.entries()) {
        const result = await runHistory({
          type: BattleReportHistoryEvent.APPEND,
          family,
          envelope: {
            id: `legacy:${sourceId}:${index}:${storageMaintenanceValueHash(record)}`,
            createdAt: index,
            migrationSourceId: sourceId,
            record,
          },
        });
        if (result?.outcome === StorageWriteOutcome.FAILED) throw result.error;
      }
    },
    async readTarget() {
      const records = await runHistory({
        type: BattleReportHistoryEvent.LIST_ENVELOPES,
        family,
      });
      return (records || [])
        .filter((record) => record.migrationSourceId === sourceId)
        .map((record) => record.record);
    },
    removeSource: () => legacy.removeKeys([key]),
  });
}

function runtimeSource(policy, legacy, deps) {
  const sourceId = "battleRuntime";
  const keys = {
    code: worldStorageKey(policy, STORAGE_KEYS.BATTLE_CODE),
    drop: worldStorageKey(policy, STORAGE_KEYS.DROP),
    usage: worldStorageKey(policy, STORAGE_KEYS.STATS),
  };
  const runCheckpoint = deps.runCheckpoint || runBattleSessionCheckpointAutomation;
  return createVerifiedMaintenanceSource({
    sourceId,
    targetIdentity: `session:${policy.auditIdentity}:battleReport`,
    async readSource() {
      const raw = {
        code: await legacy.readKey(keys.code),
        drop: await legacy.readKey(keys.drop),
        usage: await legacy.readKey(keys.usage),
      };
      return raw.code || raw.drop || raw.usage ? raw : null;
    },
    normalize(raw) {
      return {
        version: 1,
        sessionId: `legacy:${storageMaintenanceValueHash(raw)}`,
        code: raw.code,
        drop: raw.drop,
        usage: raw.usage,
      };
    },
    async writeTarget(value) {
      const current = runCheckpoint({
        type: BattleSessionCheckpointEvent.READ_SLICE,
        slice: BattleSessionCheckpointSlice.BATTLE_REPORT,
      });
      if (
        current?.kind === "loaded" &&
        storageMaintenanceValueHash(current.checkpoint) !== storageMaintenanceValueHash(value)
      ) {
        const error = new Error("battle runtime target contains newer session data");
        error.recovery = "finishCurrentSessionThenRetry";
        throw error;
      }
      const result = runCheckpoint({
        type: BattleSessionCheckpointEvent.CHECKPOINT_SLICE,
        slice: BattleSessionCheckpointSlice.BATTLE_REPORT,
        value,
        lifecycleBoundary: true,
      });
      if (result?.outcome === StorageWriteOutcome.FAILED) throw result.error;
    },
    async readTarget() {
      const result = runCheckpoint({
        type: BattleSessionCheckpointEvent.READ_SLICE,
        slice: BattleSessionCheckpointSlice.BATTLE_REPORT,
      });
      return result?.kind === "loaded" ? result.checkpoint : null;
    },
    removeSource: () => legacy.removeKeys(Object.values(keys)),
  });
}

export function createBattleStorageMaintenanceSources(policy, legacy, deps = {}) {
  return Object.freeze([
    historySource(policy, legacy, BattleReportFamily.DROP, STORAGE_KEYS.DROP_OLD, deps),
    historySource(policy, legacy, BattleReportFamily.USAGE, STORAGE_KEYS.STATS_OLD, deps),
    runtimeSource(policy, legacy, deps),
  ]);
}
