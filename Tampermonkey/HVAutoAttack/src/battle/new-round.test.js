import { describe, expect, it } from "vitest";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./new-round.js";

describe("runBattleRoundStartAutomation", () => {
  it("ignores unknown events", () => {
    expect(runBattleRoundStartAutomation({ type: "unknown" })).toBe(false);
  });

  it("exposes the round started event", () => {
    expect(BattleRoundStartEvent.ROUND_STARTED).toBe("roundStarted");
  });
});
