import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";

function readExistingUsageStats(deps) {
  return runBattleRecordArchiveAutomation(
    { type: BattleRecordArchiveEvent.READ_USAGE_STATS },
    deps
  );
}

export function recordCompletedUsage(deps = {}) {
  const context = (
    deps.readCompletionContext ||
    (() => runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.USAGE_COMPLETION_CONTEXT }))
  )();
  if (!context.recordUsage) return { kind: "skipped", reason: "recordUsageDisabled" };
  const stats = readExistingUsageStats(deps);
  if (!stats) return { kind: "skipped", reason: "usageStatsMissing" };
  stats.self._monster += context.monsterAll;
  stats.self._boss += context.bossAll;

  const archiveResult = runBattleRecordArchiveAutomation(
    {
      type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_USAGE_STATS,
      record: stats,
      recordEach: context.recordEach,
      roundNow: context.roundNow,
      roundAll: context.roundAll,
    },
    deps
  );
  if (archiveResult === false) return { kind: "failed", reason: "usageArchiveFailed" };
  return { kind: "recorded", archive: archiveResult };
}
