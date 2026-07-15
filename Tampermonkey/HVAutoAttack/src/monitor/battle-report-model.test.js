import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { getValue, setValue } from "../state/storage.js";
import {
  BattleSessionCheckpointEvent,
  runBattleSessionCheckpointAutomation,
} from "../state/battle-session-checkpoint.js";
import { BattleReportModelEvent, runBattleReportModel } from "./battle-report-model.js";
import {
  clearBattleReportTargetHistory,
  seedActiveBattleReport,
} from "./battle-report-test-fixture.js";

beforeEach(async () => {
  localStorage.clear();
  runBattleSessionCheckpointAutomation({ type: BattleSessionCheckpointEvent.CLEAR });
  await clearBattleReportTargetHistory();
});

describe("runBattleReportModel", () => {
  it("rejects unknown and null model events without reading report sources", () => {
    setValue(STORAGE_KEYS.DROP, { "#Credit": 12 });
    setValue(STORAGE_KEYS.DROP_OLD, [{ "#EXP": 20 }]);

    expect(runBattleReportModel({ type: "unknown" })).toBeUndefined();
    expect(runBattleReportModel(null)).toBeUndefined();

    expect(getValue(STORAGE_KEYS.DROP, true)).toEqual({ "#Credit": 12 });
    expect(getValue(STORAGE_KEYS.DROP_OLD, true)).toEqual([{ "#EXP": 20 }]);
  });

  it("builds a single drop report model from the active record", async () => {
    seedActiveBattleReport({ drop: { "#Credit": 12 } });

    expect(
      await runBattleReportModel({ type: BattleReportModelEvent.READ_DROP_REPORT_MODEL })
    ).toEqual({ mode: "single", rows: [{ key: "#Credit", value: 12 }] });
  });
});
