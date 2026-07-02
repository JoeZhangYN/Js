// 战斗日志解析 + 掉落物追踪。
import { gE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
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
    delValue: deps.delValue || delValue,
    gE: deps.gE || gE,
    getValue: deps.getValue || getValue,
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
    setValue: deps.setValue || setValue,
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

  runBattleRecordArchiveAutomation(
    {
      type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD,
      record: drop,
      recordEach: context.recordEach,
      roundNow: context.roundNow,
      roundAll: context.roundAll,
    },
    deps
  );
}

const dropEventHandlers = Object.freeze({
  [EVENT_RECORD_BATTLE_DROPS]: (_event, deps) => {
    const runtime = makeDeps(deps);
    const context = runtime.readDropCompletionContext();
    if (!context.dropMonitor) return false;
    recordBattleDrops(runtime, context);
    return true;
  },
});

export function runBattleDropAutomation(event = { type: EVENT_RECORD_BATTLE_DROPS }, deps = {}) {
  const handler = dropEventHandlers[event?.type];
  if (!handler) return false;
  return handler(event, deps);
}
