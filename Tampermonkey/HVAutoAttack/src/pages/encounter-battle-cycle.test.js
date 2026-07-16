import { describe, expect, it } from "vitest";
import {
  completeEncounterBattleCycle,
  defaultEncounterBattleCycle,
  EncounterDayPhase,
  recordPostLimitEmptyCycle,
} from "./encounter-battle-cycle.js";

describe("encounter battle-cycle identity", () => {
  it("counts only a battle terminal and does not own either clock", () => {
    const completed = completeEncounterBattleCycle({
      ...defaultEncounterBattleCycle(Date.UTC(2026, 5, 27)),
      count: 23,
    });

    expect(completed).toEqual({
      count: 24,
      utcDay: "2026-06-27",
      dayPhase: EncounterDayPhase.CONFIRMING_LIMIT,
      invalidCycleCount: 0,
    });
    expect(completed).not.toHaveProperty("date");
    expect(completed).not.toHaveProperty("cycleReadyAt");
    expect(completed).not.toHaveProperty("generationNextAttemptAt");
  });

  it("counts post-limit automatic empties without pretending they are battles", () => {
    const cycle = {
      count: 24,
      utcDay: "2026-06-27",
      dayPhase: EncounterDayPhase.CONFIRMING_LIMIT,
      invalidCycleCount: 2,
    };

    expect(recordPostLimitEmptyCycle(cycle)).toEqual({
      count: 24,
      utcDay: "2026-06-27",
      dayPhase: EncounterDayPhase.STOPPED_FOR_DAY,
      invalidCycleCount: 3,
    });
  });
});
