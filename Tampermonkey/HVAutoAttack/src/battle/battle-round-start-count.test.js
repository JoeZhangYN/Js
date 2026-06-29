import { beforeEach, describe, expect, it } from "vitest";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";

beforeEach(() => {
  localStorage.clear();
});

describe("battle round start count", () => {
  it("records initialized round counts from the round start context", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_START_COUNT,
        initialized: true,
        initializingText: "Initializing arena challenge #10 (Round 2 / 5)",
        roundType: "ar",
        repaired: false,
      })
    ).toEqual({ roundNow: 2, roundAll: 5 });
  });

  it("records a fallback single round after monster status repair", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_START_COUNT,
        initialized: false,
        initializingText: "Round begins",
        roundType: "",
        repaired: true,
      })
    ).toEqual({ roundNow: 1, roundAll: 1 });
  });

  it("does not rewrite counts when no initialization or repair happened", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_START_COUNT,
        initialized: false,
        initializingText: "Round begins",
        roundType: "",
        repaired: false,
      })
    ).toBeNull();
  });
});
