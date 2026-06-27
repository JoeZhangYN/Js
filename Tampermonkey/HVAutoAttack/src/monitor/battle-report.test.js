import { beforeEach, describe, expect, it } from "vitest";
import { setValue, getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { BattleMonitorEvent, runBattleMonitorAutomation } from "./battle-monitor-automation.js";

beforeEach(() => {
  localStorage.clear();
});

describe("battle report query", () => {
  it("records battle report code once when per-battle records are enabled", () => {
    g("option", { recordEach: true });
    g("roundType", "ar");
    g("roundAll", 5);

    runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toMatch(/: AR-5$/);

    const firstCode = getValue(STORAGE_KEYS.BATTLE_CODE);
    g("roundType", "rb");
    g("roundAll", 1);
    runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toBe(firstCode);
  });

  it("builds a single drop report from the active record", () => {
    setValue(STORAGE_KEYS.DROP, { "#Credit": 12, "Health Potion": 1 });

    expect(runBattleMonitorAutomation({ type: BattleMonitorEvent.READ_DROP_REPORT })).toEqual({
      mode: "single",
      rows: [
        { key: "#Credit", value: 12 },
        { key: "Health Potion", value: 1 },
      ],
    });
  });

  it("combines archived and active drop records for history view", () => {
    setValue(STORAGE_KEYS.BATTLE_CODE, "now");
    setValue(STORAGE_KEYS.DROP, { "#Credit": 12 });
    setValue(STORAGE_KEYS.DROP_OLD, [{ __name: "old", "#EXP": 20 }]);

    expect(runBattleMonitorAutomation({ type: BattleMonitorEvent.READ_DROP_REPORT })).toEqual({
      mode: "history",
      columns: ["now", "old"],
      rows: [
        { key: "#Credit", values: [12, ""] },
        { key: "#EXP", values: ["", 20] },
      ],
    });
  });

  it("builds usage sections and tolerates missing sections", () => {
    setValue(STORAGE_KEYS.BATTLE_CODE, "now");
    setValue(STORAGE_KEYS.STATS, { self: { _turn: 3 }, magic: { Fireball: 2 } });
    setValue(STORAGE_KEYS.STATS_OLD, [{ __name: "old", self: { _turn: 1 } }]);

    const report = runBattleMonitorAutomation({ type: BattleMonitorEvent.READ_USAGE_REPORT });
    expect(report.mode).toBe("history");
    expect(report.columns).toEqual(["now", "old"]);
    expect(report.sections.find((s) => s.key === "self").rows).toEqual([
      { key: "_turn", values: [3, 1] },
    ]);
    expect(report.sections.find((s) => s.key === "magic").rows).toEqual([
      { key: "Fireball", values: [2, ""] },
    ]);
  });

  it("clears battle report storage through monitor-owned commands", () => {
    setValue(STORAGE_KEYS.DROP, { a: 1 });
    setValue(STORAGE_KEYS.DROP_OLD, [{ a: 2 }]);
    setValue(STORAGE_KEYS.STATS, { self: {} });
    setValue(STORAGE_KEYS.STATS_OLD, [{ self: {} }]);

    runBattleMonitorAutomation({ type: BattleMonitorEvent.CLEAR_DROP_REPORT });
    runBattleMonitorAutomation({ type: BattleMonitorEvent.CLEAR_USAGE_REPORT });

    expect(getValue(STORAGE_KEYS.DROP, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.DROP_OLD, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.STATS, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toBeNull();
  });
});
