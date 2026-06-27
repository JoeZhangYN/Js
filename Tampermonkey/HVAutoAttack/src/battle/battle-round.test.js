import { beforeEach, describe, expect, it } from "vitest";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";

beforeEach(() => {
  localStorage.clear();
});

describe("runBattleRoundAutomation", () => {
  it("records and reads battle round type through the entry", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_TYPE,
        roundType: "ar",
      })
    ).toBe("ar");

    expect(runBattleRoundAutomation({ type: BattleRoundEvent.READ_TYPE })).toBe("ar");
    expect(getValue(STORAGE_KEYS.ROUND_TYPE)).toBe("ar");
  });

  it("classifies battle type from initialization text in one place", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.CLASSIFY_TYPE,
        initializingText: "Initializing arena challenge #5 (Round 1 / 5)",
      })
    ).toBe("ar");
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.CLASSIFY_TYPE,
        initializingText: "Initializing arena challenge #105 (Round 1 / 1)",
      })
    ).toBe("rb");
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.CLASSIFY_TYPE,
        initializingText: "Initializing random encounter",
      })
    ).toBe("ba");
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.CLASSIFY_TYPE,
        initializingText: "Initializing Item World",
      })
    ).toBe("iw");
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.CLASSIFY_TYPE,
        initializingText: "Initializing Grindfest",
      })
    ).toBe("gr");
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.CLASSIFY_TYPE,
        initializingText: "Initializing The Tower",
      })
    ).toBe("tw");
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.CLASSIFY_TYPE,
        initializingText: "You hit the monster",
      })
    ).toBe("");
  });

  it("records round counts and syncs runtime from persisted state", () => {
    runBattleRoundAutomation({
      type: BattleRoundEvent.RECORD_COUNT,
      roundNow: 2,
      roundAll: 5,
    });

    expect(runBattleRoundAutomation({ type: BattleRoundEvent.SYNC_RUNTIME })).toEqual({
      roundNow: 2,
      roundAll: 5,
      roundLeft: 3,
    });
    expect(g("roundNow")).toBe(2);
    expect(g("roundAll")).toBe(5);
    expect(g("roundLeft")).toBe(3);
  });

  it("records round counts from initialization text in the round boundary", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_COUNT_FROM_INITIALIZATION,
        initializingText: "Initializing arena challenge #10 (Round 2 / 5)",
        roundType: "ar",
      })
    ).toEqual({ roundNow: 2, roundAll: 5 });

    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_COUNT_FROM_INITIALIZATION,
        initializingText: "Initializing random encounter (Round 2 / 5)",
        roundType: "ba",
      })
    ).toEqual({ roundNow: 1, roundAll: 1 });

    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_COUNT_FROM_INITIALIZATION,
        initializingText: "Initializing Item World",
        roundType: "iw",
      })
    ).toEqual({ roundNow: 1, roundAll: 1 });
  });

  it("records fallback single-round battles through the same entry", () => {
    expect(runBattleRoundAutomation({ type: BattleRoundEvent.RECORD_SINGLE_ROUND })).toEqual({
      roundNow: 1,
      roundAll: 1,
    });
    expect(getValue(STORAGE_KEYS.ROUND_NOW)).toBe("1");
    expect(getValue(STORAGE_KEYS.ROUND_ALL)).toBe("1");
  });
});
