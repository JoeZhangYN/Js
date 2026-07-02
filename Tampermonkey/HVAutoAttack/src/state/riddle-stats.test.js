import { beforeEach, describe, expect, it } from "vitest";
import { RiddleLogEvent, runRiddleLogAutomation } from "./riddle-log.js";
import { ML_OUTCOMES, RiddleStatsEvent, runRiddleStatsAutomation } from "./riddle-stats.js";

beforeEach(() => {
  localStorage.clear();
});

describe("riddle stats entry", () => {
  it("ignores invalid stats events at the entry without changing stats or log", () => {
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR });

    expect(runRiddleStatsAutomation({ type: "unknown" })).toBeUndefined();
    expect(runRiddleStatsAutomation(null)).toBeUndefined();
    expect(runRiddleStatsAutomation({ type: RiddleStatsEvent.READ }).appear).toBe(1);
    expect(runRiddleLogAutomation({ type: RiddleLogEvent.READ }).length).toBe(1);
  });

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

  it("renders the stats report rows with derived success rate", () => {
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR });
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_OUTCOME, outcome: "ok" });
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_OUTCOME, outcome: "timeout" });

    const html = runRiddleStatsAutomation({ type: RiddleStatsEvent.RENDER_REPORT_ROWS });

    expect(html).toContain("50.0% (1/2)");
    expect(html).toContain("Riddle appearances");
    expect(html).toContain("Timeout(>12s)");
  });

  it("escapes the rendered last failure detail", () => {
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_DETAIL, detail: "<bad>" });

    expect(runRiddleStatsAutomation({ type: RiddleStatsEvent.RENDER_REPORT_ROWS })).toContain(
      "&lt;bad&gt;"
    );
  });
});
