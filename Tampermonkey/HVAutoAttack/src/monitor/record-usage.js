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

function readCurrentUsageStats(deps) {
  return runBattleRecordArchiveAutomation(
    { type: BattleRecordArchiveEvent.READ_OR_CREATE_USAGE_STATS },
    deps
  );
}

function storeCurrentUsageStats(stats, deps) {
  return runBattleRecordArchiveAutomation(
    { type: BattleRecordArchiveEvent.STORE_USAGE_STATS, record: stats },
    deps
  );
}

function recordActionUsage(parm, deps) {
  const stats = readCurrentUsageStats(deps);
  const context = (
    deps.readActionContext ||
    (() => runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.USAGE_ACTION_CONTEXT }))
  )();
  applyBattleActionUsageStats(stats, parm, context);
  const archiveResult = storeCurrentUsageStats(stats, deps);
  if (archiveResult === false) return { kind: "failed", reason: "usageArchiveFailed" };
  return { kind: "recorded", archive: archiveResult };
}

const usageEventHandlers = Object.freeze({
  [EVENT_RECORD_ACTION_USAGE]: (event, deps) => recordActionUsage(event.usage, deps),
  [EVENT_RECORD_COMPLETED_USAGE]: (_event, deps) => recordCompletedUsage(deps),
});

export function runBattleUsageAutomation(event, deps = {}) {
  const handler = usageEventHandlers[event?.type];
  return handler ? handler(event, deps) : undefined;
}
