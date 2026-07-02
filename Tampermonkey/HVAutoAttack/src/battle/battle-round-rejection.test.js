import { beforeEach, describe, expect, it } from "vitest";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";

beforeEach(() => {
  localStorage.clear();
});

describe("runBattleRoundAutomation rejection", () => {
  it("rejects invalid events without changing round state", () => {
    runBattleRoundAutomation({
      type: BattleRoundEvent.RECORD_COUNT,
      roundNow: 2,
      roundAll: 5,
    });
    g("roundNow", 9);
    g("roundAll", 9);
    g("roundLeft", 0);

    expect(runBattleRoundAutomation({ type: "unknown", roundNow: 1, roundAll: 1 })).toBeNull();
    expect(runBattleRoundAutomation(null)).toBeNull();

    expect(getValue(STORAGE_KEYS.ROUND_NOW)).toBe("2");
    expect(getValue(STORAGE_KEYS.ROUND_ALL)).toBe("5");
    expect(g("roundNow")).toBe(9);
    expect(g("roundAll")).toBe(9);
    expect(g("roundLeft")).toBe(0);
  });
});
