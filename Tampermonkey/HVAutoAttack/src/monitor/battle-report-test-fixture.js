import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import {
  BattleReportFamily,
  BattleReportHistoryEvent,
  runBattleReportHistoryAutomation,
} from "./battle-report-history.js";

export async function clearBattleReportTargetHistory() {
  await runBattleReportHistoryAutomation({
    type: BattleReportHistoryEvent.CLEAR,
    family: BattleReportFamily.DROP,
  });
  await runBattleReportHistoryAutomation({
    type: BattleReportHistoryEvent.CLEAR,
    family: BattleReportFamily.USAGE,
  });
}

export function seedActiveBattleReport({ code = null, drop = null, usage = null }) {
  if (code) {
    runBattleRecordArchiveAutomation({
      type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
      enabled: true,
      code,
    });
  }
  if (drop) {
    runBattleRecordArchiveAutomation({
      type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD,
      record: drop,
      recordEach: false,
    });
  }
  if (usage) {
    runBattleRecordArchiveAutomation({
      type: BattleRecordArchiveEvent.STORE_USAGE_STATS,
      record: usage,
    });
  }
}

export function seedBattleReportHistory(family, id, record) {
  return runBattleReportHistoryAutomation({
    type: BattleReportHistoryEvent.APPEND,
    family,
    envelope: { id, createdAt: 1, record },
  });
}

export { BattleReportFamily };
