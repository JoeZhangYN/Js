// 每回合技能/物品使用统计 + 战斗结束聚合。
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";
import { applyBattleActionUsageStats } from "./record-usage-action-stats.js";
import { recordCompletedUsage } from "./record-usage-completion.js";

const EVENT_RECORD_ACTION_USAGE = "recordActionUsage";
const EVENT_RECORD_COMPLETED_USAGE = "recordCompletedUsage";

export const BattleUsageEvent = Object.freeze({
  RECORD_ACTION_USAGE: EVENT_RECORD_ACTION_USAGE,
  RECORD_COMPLETED_USAGE: EVENT_RECORD_COMPLETED_USAGE,
});

function readCurrentUsageStats() {
  return runBattleRecordArchiveAutomation({
    type: BattleRecordArchiveEvent.READ_OR_CREATE_USAGE_STATS,
  });
}

function storeCurrentUsageStats(stats) {
  runBattleRecordArchiveAutomation({
    type: BattleRecordArchiveEvent.STORE_USAGE_STATS,
    record: stats,
  });
}

function recordActionUsage(parm) {
  const stats = readCurrentUsageStats();
  const context = runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.USAGE_ACTION_CONTEXT });
  applyBattleActionUsageStats(stats, parm, context);
  storeCurrentUsageStats(stats);
}

const usageEventHandlers = Object.freeze({
  [EVENT_RECORD_ACTION_USAGE]: (event) => recordActionUsage(event.usage),
  [EVENT_RECORD_COMPLETED_USAGE]: () => recordCompletedUsage(),
});

export function runBattleUsageAutomation(event) {
  usageEventHandlers[event?.type]?.(event);
  return undefined;
}
