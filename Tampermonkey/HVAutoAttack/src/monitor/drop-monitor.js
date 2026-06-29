// 战斗日志解析 + 掉落物追踪。
import { gE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";

const EVENT_COMPLETION_REACHED = "completionReached";

export const BattleDropEvent = Object.freeze({
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
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

  const quality = [
    "Crude",
    "Fair",
    "Average",
    "Superior",
    "Exquisite",
    "Magnificent",
    "Legendary",
    "Peerless",
  ];
  const dropQuality = context.dropQuality;

  for (const log of battleLog) {
    const text = log.textContent;

    if (text === "You are Victorious!") {
      break;
    }

    if (/^You gain \d+ (EXP|Credit)/.test(text)) {
      const [, amount, type] = text.match(/^You gain (\d+) (EXP|Credit)/);
      drop[`#${type}`] += Number(amount);
      continue;
    }

    const item = deps.gE("span", log);
    if (!item) continue;

    const name = item.textContent.match(/^\[(.*?)\]$/)[1];

    if (item.style.color === "rgb(255, 0, 0)") {
      for (let j = dropQuality; j < quality.length; j++) {
        if (name.includes(quality[j])) {
          const equipmentName = `Equipment of ${name.match(/^\w+/)[0]}`;
          drop[equipmentName] = (drop[equipmentName] || 0) + 1;
          break;
        }
      }
    } else if (item.style.color === "rgb(186, 5, 180)") {
      const [, amount = "1", crystalName = name] = name.match(/^(\d+)x (Crystal of \w+)$/) || [];
      drop[crystalName] = (drop[crystalName] || 0) + Number(amount);
    } else if (item.style.color === "rgb(168, 144, 0)") {
      drop["#Credit"] += Number(name.match(/\d+/)[0]);
    } else {
      drop[name] = (drop[name] || 0) + 1;
    }
  }

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

export function runBattleDropAutomation(event = { type: EVENT_COMPLETION_REACHED }, deps = {}) {
  if (event.type !== EVENT_COMPLETION_REACHED) return false;
  const runtime = makeDeps(deps);
  const context = runtime.readDropCompletionContext();
  if (!context.dropMonitor) return false;
  recordBattleDrops(runtime, context);
  return true;
}
