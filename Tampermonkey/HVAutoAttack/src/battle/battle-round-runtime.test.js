import { beforeEach, describe, expect, it } from "vitest";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";

beforeEach(() => {
  localStorage.clear();
});

describe("runBattleRoundAutomation runtime invariants", () => {
  it("normalizes round counts before persisting and publishing runtime state", () => {
    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_COUNT,
        roundNow: "bad",
        roundAll: "4.9",
      })
    ).toEqual({ roundNow: 1, roundAll: 4 });

    expect(getValue(STORAGE_KEYS.ROUND_NOW)).toBe("1");
    expect(getValue(STORAGE_KEYS.ROUND_ALL)).toBe("4");
    expect(runBattleRoundAutomation({ type: BattleRoundEvent.SYNC_RUNTIME })).toEqual({
      roundNow: 1,
      roundAll: 4,
      roundLeft: 3,
    });
  });

  it("normalizes runtime reads through the round entry", () => {
    g("roundNow", "4");
    g("roundAll", "bad");

    expect(runBattleRoundAutomation({ type: BattleRoundEvent.READ_RUNTIME })).toEqual({
      roundNow: 4,
      roundAll: 1,
      roundLeft: -3,
    });
  });
});
