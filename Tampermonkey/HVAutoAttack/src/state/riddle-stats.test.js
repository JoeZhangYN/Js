import { beforeEach, describe, expect, it } from "vitest";
import { RiddleLogEvent, runRiddleLogAutomation } from "./riddle-log.js";
import { ML_OUTCOMES, RiddleStatsEvent, runRiddleStatsAutomation } from "./riddle-stats.js";

beforeEach(() => {
  localStorage.clear();
});

describe("riddle stats entry", () => {
  it("records riddle appearances and ML outcomes through the entry", () => {
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR });
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_OUTCOME, outcome: "ok" });
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_OUTCOME, outcome: "not_real" });

    const stats = runRiddleStatsAutomation({ type: RiddleStatsEvent.READ });
    expect(stats.appear).toBe(1);
    expect(stats.mlCall).toBe(2);
    expect(stats.ok).toBe(1);
    expect(stats.outcomes.ok).toBe(1);
    expect(stats.outcomes.unknown).toBe(1);
    expect(Object.keys(stats.outcomes)).toEqual(Object.keys(ML_OUTCOMES));
  });

  it("records failure detail into stats and the riddle log", () => {
    runRiddleStatsAutomation({
      type: RiddleStatsEvent.RECORD_DETAIL,
      detail: "x".repeat(350),
    });

    expect(runRiddleStatsAutomation({ type: RiddleStatsEvent.READ }).lastError).toBe(
      "x".repeat(300)
    );
    expect(runRiddleLogAutomation({ type: RiddleLogEvent.READ })[0].m).toBe(
      `detail: ${"x".repeat(350)}`.slice(0, 300)
    );
  });

  it("resets stats without clearing the riddle log", () => {
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR });
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RESET });

    expect(runRiddleStatsAutomation({ type: RiddleStatsEvent.READ }).appear).toBe(0);
    expect(runRiddleLogAutomation({ type: RiddleLogEvent.READ }).length).toBe(1);
  });
});
