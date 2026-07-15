// 战斗日志解析 + 掉落物追踪。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";
import { applyBattleDropLog } from "./drop-recording.js";

const EVENT_RECORD_BATTLE_DROPS = "recordBattleDrops";

export const BattleDropEvent = Object.freeze({
  RECORD_BATTLE_DROPS: EVENT_RECORD_BATTLE_DROPS,
});

function makeDeps(deps) {
  return {
    gE: deps.gE || gE,
    randomId: deps.randomId,
    runCheckpoint: deps.runCheckpoint,
    runHistory: deps.runHistory,
    readDropCompletionContext:
      deps.readDropCompletionContext ||
      (() =>
        runBattleMonitorRuntime(
          { type: BattleMonitorRuntimeEvent.DROP_COMPLETION_CONTEXT },
          {
            g: deps.g || g,
            readOptionField: deps.readOptionField,
          }
        )),
    readLocalTimestampLabel: deps.readLocalTimestampLabel,
  };
}

function recordBattleDrops(deps, context) {
  const battleLog = deps.gE("#textlog>tbody>tr>td", "all");
  const drop = runBattleRecordArchiveAutomation(
    {
      type: BattleRecordArchiveEvent.READ_OR_CREATE_DROP_RECORD,
    },
    deps
  );
  applyBattleDropLog(drop, battleLog, {
    dropQuality: context.dropQuality,
    readItem: (log) => deps.gE("span", log),
  });

  const archiveResult = runBattleRecordArchiveAutomation(
    {
      type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD,
      record: drop,
      recordEach: context.recordEach,
      roundNow: context.roundNow,
      roundAll: context.roundAll,
    },
    deps
  );
  if (archiveResult === false) return { kind: "failed", reason: "dropArchiveFailed" };
  return { kind: "recorded", archive: archiveResult };
}

const dropEventHandlers = Object.freeze({
  [EVENT_RECORD_BATTLE_DROPS]: (_event, deps) => {
    const runtime = makeDeps(deps);
    const context = runtime.readDropCompletionContext();
    if (!context.dropMonitor) return { kind: "skipped", reason: "dropMonitorDisabled" };
    return recordBattleDrops(runtime, context);
  },
});

export function runBattleDropAutomation(event = { type: EVENT_RECORD_BATTLE_DROPS }, deps = {}) {
  const handler = dropEventHandlers[event?.type];
  if (!handler) return false;
  return handler(event, deps);
}
