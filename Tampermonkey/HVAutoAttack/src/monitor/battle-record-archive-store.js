import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";
import { createBattleRecordLegacyAdapter } from "./battle-record-legacy-adapter.js";
import { persistBattleRecordArchiveStep } from "./battle-record-archive-failure.js";
import {
  BattleReportHistoryEvent,
  runBattleReportHistoryAutomation,
} from "./battle-report-history.js";
import {
  BattleReportCheckpointMode,
  createBattleReportRuntimeStore,
} from "./battle-report-runtime-store.js";

const REPORT_RECORD_NAME_FIELD = "__name";

function shouldArchive({ recordEach, roundNow, roundAll }) {
  return Boolean(recordEach && roundNow === roundAll);
}

function writePath(record, path, value) {
  const parts = String(path).split(".");
  let target = record;
  for (const part of parts.slice(0, -1)) {
    target[part] = target[part] || {};
    target = target[part];
  }
  target[parts.at(-1)] = value;
}

function clone(record) {
  return JSON.parse(JSON.stringify(record || {}));
}

export function createBattleRecordArchiveStore(deps = {}) {
  const runtime = deps.runtime || createBattleReportRuntimeStore(deps);
  const legacy = deps.legacy || createBattleRecordLegacyAdapter(deps);
  const runHistory = deps.runHistory || runBattleReportHistoryAutomation;
  const timestamp =
    deps.readLocalTimestampLabel ||
    (() => runTimeAutomation({ type: TimeEvent.LOCAL_TIMESTAMP_LABEL }));

  function readOrCreateCurrentRecord(event) {
    const existing = runtime.readCurrent(event.family);
    if (existing) return existing;
    const record = clone(event.defaultRecord);
    if (event.startTimeField) writePath(record, event.startTimeField, timestamp());
    return record;
  }

  async function readRecordSet(event) {
    const currentName = runtime.readCode();
    const currentRaw = runtime.readCurrent(event.family);
    const incremental = await runHistory({
      type: BattleReportHistoryEvent.LIST,
      family: event.family,
    });
    return {
      currentName,
      currentRaw,
      history: [...legacy.readHistory(event.family), ...(incremental || [])],
    };
  }

  function storeOrArchiveRecord(event) {
    if (!shouldArchive(event)) {
      const result = runtime.store(event.family, event.record, event.checkpointMode);
      return result.outcome === StorageWriteOutcome.FAILED ? false : { archived: false };
    }
    const archived = { ...clone(event.record), [REPORT_RECORD_NAME_FIELD]: runtime.readCode() };
    if (event.endTimeField) writePath(archived, event.endTimeField, timestamp());
    const identity = runtime.archiveIdentity(event.family);
    const completion = Promise.resolve(
      runHistory({
        type: BattleReportHistoryEvent.APPEND,
        family: event.family,
        envelope: { ...identity, record: archived },
      })
    ).then((result) => {
      if (result?.outcome === StorageWriteOutcome.FAILED) return false;
      return runtime.clearFamily(event.family).outcome !== StorageWriteOutcome.FAILED;
    });
    return { archived: true, record: archived, completion };
  }

  async function clearRecordSet(event) {
    const result = await runHistory({ type: BattleReportHistoryEvent.CLEAR, family: event.family });
    if (result?.outcome === StorageWriteOutcome.FAILED) return false;
    if (
      !persistBattleRecordArchiveStep("clear-legacy-history", event.family, () =>
        legacy.clearHistory(event.family)
      )
    ) {
      return false;
    }
    return runtime.clearFamily(event.family).outcome !== StorageWriteOutcome.FAILED;
  }

  return Object.freeze({
    clearRecordSet,
    readCurrentRecord: (event) => runtime.readCurrent(event.family),
    readOrCreateCurrentRecord,
    readRecordSet,
    startBattleReportRecording: (event) => runtime.start(event),
    storeOrArchiveRecord,
  });
}

export { BattleReportCheckpointMode };
