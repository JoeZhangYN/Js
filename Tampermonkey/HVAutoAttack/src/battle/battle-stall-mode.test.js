import { describe, expect, it } from "vitest";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "./battle-stall-mode.js";

function snap(over = {}) {
  return {
    oc: 100,
    roundNow: 1,
    roundAll: 3,
    mp: 100,
    sp: 100,
    playerBuffs: [],
    view: [{ id: 1, isDead: false, hpPercent: 0.8 }],
    ...over,
  };
}

describe("battle stall mode", () => {
  it("answers whether battle should stall from one entry", () => {
    expect(
      runBattleStallModeAutomation({
        type: BattleStallModeEvent.READ_ACTIVE,
        snap: snap(),
        opt: {},
      })
    ).toBe(true);
    expect(
      runBattleStallModeAutomation({
        type: BattleStallModeEvent.READ_ACTIVE,
        snap: snap({ roundNow: 3, roundAll: 3 }),
        opt: {},
      })
    ).toBe(false);
  });

  it("uses explicit runtime round values when supplied by rule orchestration", () => {
    expect(
      runBattleStallModeAutomation({
        type: BattleStallModeEvent.READ_ACTIVE,
        snap: snap({ roundNow: undefined, roundAll: undefined }),
        opt: {},
        roundNow: 1,
        roundAll: 3,
      })
    ).toBe(true);
  });

  it("answers stall topup candidates from the same entry", () => {
    expect(
      runBattleStallModeAutomation({
        type: BattleStallModeEvent.READ_TOPUP_CANDIDATES,
        snap: snap({ mp: 50, sp: 50, playerBuffs: ["spiritpot"] }),
        opt: {},
      })
    ).toEqual([11291]);
  });
});
