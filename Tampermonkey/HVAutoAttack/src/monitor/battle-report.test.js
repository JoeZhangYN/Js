import { beforeEach, describe, expect, it } from "vitest";
import { setValue, getValue } from "../state/storage.js";
import {
  clearDropReport,
  clearUsageReport,
  recordBattleReportStarted,
  readDropReport,
  readUsageReport,
} from "./battle-report.js";

beforeEach(() => {
  localStorage.clear();
});

describe("battle report query", () => {
  it("records battle report code once when per-battle records are enabled", () => {
    expect(
      recordBattleReportStarted({
        recordEach: true,
        roundType: "ar",
        roundAll: 5,
        timeLabel: "12:34",
      })
    ).toBe(true);
    expect(getValue("battleCode")).toBe("12:34: AR-5");

    expect(
      recordBattleReportStarted({
        recordEach: true,
        roundType: "rb",
        roundAll: 1,
        timeLabel: "12:35",
      })
    ).toBe(false);
    expect(getValue("battleCode")).toBe("12:34: AR-5");
  });

  it("builds a single drop report from the active record", () => {
    setValue("drop", { "#Credit": 12, "Health Potion": 1 });

    expect(readDropReport()).toEqual({
      mode: "single",
      rows: [
        { key: "#Credit", value: 12 },
        { key: "Health Potion", value: 1 },
      ],
    });
  });

  it("combines archived and active drop records for history view", () => {
    setValue("battleCode", "now");
    setValue("drop", { "#Credit": 12 });
    setValue("dropOld", [{ __name: "old", "#EXP": 20 }]);

    expect(readDropReport()).toEqual({
      mode: "history",
      columns: ["now", "old"],
      rows: [
        { key: "#Credit", values: [12, ""] },
        { key: "#EXP", values: ["", 20] },
      ],
    });
  });

  it("builds usage sections and tolerates missing sections", () => {
    setValue("battleCode", "now");
    setValue("stats", { self: { _turn: 3 }, magic: { Fireball: 2 } });
    setValue("statsOld", [{ __name: "old", self: { _turn: 1 } }]);

    const report = readUsageReport();
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
    setValue("drop", { a: 1 });
    setValue("dropOld", [{ a: 2 }]);
    setValue("stats", { self: {} });
    setValue("statsOld", [{ self: {} }]);

    clearDropReport();
    clearUsageReport();

    expect(getValue("drop", true)).toBeNull();
    expect(getValue("dropOld", true)).toBeNull();
    expect(getValue("stats", true)).toBeNull();
    expect(getValue("statsOld", true)).toBeNull();
  });
});
