import { beforeEach, describe, expect, it } from "vitest";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";

beforeEach(() => {
  localStorage.clear();
});

describe("battle round start context", () => {
  it("records a new random encounter start context from the initialization text", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_START_CONTEXT,
        initializingText: "Initializing random encounter",
      })
    ).toEqual({
      initialized: true,
      roundType: "ba",
      randomEncounterStarted: true,
    });
    expect(runBattleRoundAutomation({ type: BattleRoundEvent.READ_TYPE })).toBe("ba");
  });

  it("keeps persisted round type authoritative without replaying encounter start", () => {
    runBattleRoundAutomation({ type: BattleRoundEvent.RECORD_TYPE, roundType: "ar" });

    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_START_CONTEXT,
        initializingText: "Initializing random encounter",
      })
    ).toEqual({
      initialized: true,
      roundType: "ar",
      randomEncounterStarted: false,
    });
  });

  it("reports non-initialization logs without leaking string checks to callers", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_START_CONTEXT,
        initializingText: "Round begins",
      })
    ).toEqual({
      initialized: false,
      roundType: "",
      randomEncounterStarted: false,
    });
  });
});
