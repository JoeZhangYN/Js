import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "../state/storage-io-metrics.js";
import {
  storageIoPolicyOf,
  StorageIdentity,
  StorageWriteOutcome,
} from "../state/storage-io-policy.js";
import { recordBattleRecordArchiveFailure } from "./battle-record-archive-failure.js";
import { createBattleReportHistoryIndexedDbAdapter } from "./battle-report-history-indexeddb.js";

export const BattleReportFamily = Object.freeze({ DROP: "drop", USAGE: "usage" });
export const BattleReportHistoryEvent = Object.freeze({
  APPEND: "append",
  LIST: "list",
  LIST_ENVELOPES: "listEnvelopes",
  CLEAR: "clear",
});

export function createBattleReportHistoryCapability(
  { dbName, sourceIdentity = CURRENT_WORLD_POLICY.auditIdentity },
  deps = {}
) {
  const policy = storageIoPolicyOf(StorageIdentity.BATTLE_REPORT);
  const adapter =
    deps.adapter ||
    createBattleReportHistoryIndexedDbAdapter({
      dbName,
      indexedDb: deps.indexedDb || globalThis.indexedDB,
    });
  const recordIo = deps.recordIo || runStorageIoMetricsAutomation;

  function observe(outcome, family, value) {
    recordIo({
      type: StorageIoMetricsEvent.RECORD,
      identity: policy.identity,
      outcome,
      logicalBytes: measureStorageLogicalBytes(family, value),
      sourceIdentity: `${sourceIdentity}:${family}`,
    });
  }

  async function append(event) {
    try {
      const result = await adapter.append(event.family, event.envelope, policy.budget);
      observe(result.outcome, event.family, event.envelope);
      return result;
    } catch (error) {
      observe(StorageWriteOutcome.FAILED, event.family, event.envelope);
      recordBattleRecordArchiveFailure("history-append", event.family, error);
      return { outcome: StorageWriteOutcome.FAILED, error };
    }
  }

  async function clear(event) {
    try {
      const result = await adapter.clear(event.family);
      observe(result.outcome, event.family, undefined);
      return result;
    } catch (error) {
      observe(StorageWriteOutcome.FAILED, event.family, undefined);
      recordBattleRecordArchiveFailure("history-clear", event.family, error);
      return { outcome: StorageWriteOutcome.FAILED, error };
    }
  }

  async function list(event) {
    try {
      return await adapter.list(event.family);
    } catch (error) {
      recordBattleRecordArchiveFailure("history-read", event.family, error);
      return [];
    }
  }

  async function listEnvelopes(event) {
    try {
      return await adapter.listEnvelopes(event.family);
    } catch (error) {
      recordBattleRecordArchiveFailure("history-read-envelopes", event.family, error);
      throw error;
    }
  }

  const handlers = Object.freeze({
    [BattleReportHistoryEvent.APPEND]: append,
    [BattleReportHistoryEvent.LIST]: list,
    [BattleReportHistoryEvent.LIST_ENVELOPES]: listEnvelopes,
    [BattleReportHistoryEvent.CLEAR]: clear,
  });
  return Object.freeze({ run: (event) => handlers[event?.type]?.(event) });
}

const currentBattleReportHistory = createBattleReportHistoryCapability({
  ...CURRENT_WORLD_POLICY.battleReport,
  sourceIdentity: CURRENT_WORLD_POLICY.auditIdentity,
});
export function runBattleReportHistoryAutomation(event) {
  return currentBattleReportHistory.run(event);
}
