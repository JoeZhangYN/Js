import { beforeEach, describe, expect, it } from "vitest";
import { g } from "../state/store.js";
import { BattleSkillUsageEvent, runBattleSkillUsageAutomation } from "./battle-skill-usage.js";

beforeEach(() => {
  g("skillOTOS", null);
});

describe("runBattleSkillUsageAutomation", () => {
  it("resets per-round skill usage through one entry", () => {
    expect(runBattleSkillUsageAutomation({ type: BattleSkillUsageEvent.RESET_ROUND })).toEqual({
      OFC: 0,
      FRD: 0,
      T3: 0,
      T2: 0,
      T1: 0,
    });
    expect(g("skillOTOS")).toEqual({ OFC: 0, FRD: 0, T3: 0, T2: 0, T1: 0 });
  });

  it("records physical skill usage without dropping existing counts", () => {
    g("skillOTOS", { OFC: 1, T3: 2, T2: "bad", UNKNOWN: 9 });

    expect(
      runBattleSkillUsageAutomation({
        type: BattleSkillUsageEvent.RECORD_USE,
        code: "T3",
      })
    ).toEqual({ OFC: 1, FRD: 0, T3: 3, T2: 0, T1: 0 });
    expect(g("skillOTOS")).toEqual({ OFC: 1, FRD: 0, T3: 3, T2: 0, T1: 0 });
  });

  it("reads current usage through the entry", () => {
    g("skillOTOS", { OFC: "1.9", FRD: -1, EXTRA: 5 });

    expect(runBattleSkillUsageAutomation({ type: BattleSkillUsageEvent.READ_USAGE })).toEqual({
      OFC: 1,
      FRD: 0,
      T3: 0,
      T2: 0,
      T1: 0,
    });
  });

  it("ignores unknown skill codes", () => {
    g("skillOTOS", { OFC: 1 });

    expect(
      runBattleSkillUsageAutomation({
        type: BattleSkillUsageEvent.RECORD_USE,
        code: "UNKNOWN",
      })
    ).toEqual({ OFC: 1, FRD: 0, T3: 0, T2: 0, T1: 0 });
    expect(g("skillOTOS")).toEqual({ OFC: 1 });
  });

  it("rejects invalid events without changing skill usage", () => {
    g("skillOTOS", { OFC: 2 });

    expect(runBattleSkillUsageAutomation({ type: "unknown", code: "OFC" })).toBeNull();
    expect(runBattleSkillUsageAutomation(null)).toBeNull();
    expect(g("skillOTOS")).toEqual({ OFC: 2 });
  });
});
