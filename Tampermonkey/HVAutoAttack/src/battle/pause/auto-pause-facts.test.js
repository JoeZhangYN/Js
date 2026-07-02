import { describe, expect, it } from "vitest";
import { BattleAutoPauseFactsEvent, runBattleAutoPauseFacts } from "./auto-pause-facts.js";

describe("runBattleAutoPauseFacts", () => {
  const snap = { hp: 30, roundNow: 4 };

  it("reads auto-pause decision facts from a battle snapshot", () => {
    expect(
      runBattleAutoPauseFacts({ type: BattleAutoPauseFactsEvent.READ_DECISION, snap })
    ).toEqual({
      conditionFacts: snap,
    });
  });

  it("rejects unknown auto-pause facts events as empty facts", () => {
    expect(runBattleAutoPauseFacts({ type: "unknown", snap })).toEqual({});
    expect(runBattleAutoPauseFacts(null)).toEqual({});
  });
});
