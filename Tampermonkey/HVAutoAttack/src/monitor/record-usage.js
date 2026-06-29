// 每回合技能/物品使用统计 + 战斗结束聚合。
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";
import { applyBattleActionUsageStats } from "./record-usage-action-stats.js";
import { recordCompletedBattleUsage } from "./record-usage-completion.js";

const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_COMPLETION_REACHED = "completionReached";

export const BattleUsageEvent = Object.freeze({
  ACTION_ENDED: EVENT_ACTION_ENDED,
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
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

function recordBattleActionUsage(parm) {
  const stats = readCurrentUsageStats();
  const context = runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.USAGE_ACTION_CONTEXT });
  applyBattleActionUsageStats(stats, parm, context);
  storeCurrentUsageStats(stats);
}

export function runBattleUsageAutomation(event) {
  if (event.type === EVENT_ACTION_ENDED) {
    recordBattleActionUsage(event.usage);
    return undefined;
  }
  if (event.type === EVENT_COMPLETION_REACHED) {
    recordCompletedBattleUsage();
    return undefined;
  }
  return undefined;
}
