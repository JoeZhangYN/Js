import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "./battle-stall-mode.js";

const mocks = vi.hoisted(() => ({
  runBattlePlayerBuffState: vi.fn(
    (event) => event.state?.playerBuffs?.includes(event.img) || false
  ),
}));

vi.mock("./player-buff-state.js", () => ({
  BattlePlayerBuffStateEvent: Object.freeze({ READ_ACTIVE: "readActive" }),
  runBattlePlayerBuffState: mocks.runBattlePlayerBuffState,
}));

beforeEach(() => {
  mocks.runBattlePlayerBuffState.mockClear();
});

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

function activeFacts(snap) {
  return {
    roundNow: snap.roundNow,
    roundAll: snap.roundAll,
    monsterFacts: snap.view,
    overcharge: snap.oc,
  };
}

function topupFacts(snap) {
  return {
    manaPercent: snap.mp,
    spiritPercent: snap.sp,
    playerBuffs: snap.playerBuffs,
  };
}

describe("battle stall mode", () => {
  it("answers whether battle should stall from one entry", () => {
    expect(
      runBattleStallModeAutomation({
        type: BattleStallModeEvent.READ_ACTIVE,
        opt: {},
        ...activeFacts(snap()),
      })
    ).toBe(true);
    expect(
      runBattleStallModeAutomation({
        type: BattleStallModeEvent.READ_ACTIVE,
        opt: {},
        ...activeFacts(snap({ roundNow: 3, roundAll: 3 })),
      })
    ).toBe(false);
  });

  it("uses explicit runtime round values when supplied by rule orchestration", () => {
    expect(
      runBattleStallModeAutomation({
        type: BattleStallModeEvent.READ_ACTIVE,
        opt: {},
        ...activeFacts(snap({ roundNow: undefined, roundAll: undefined })),
        roundNow: 1,
        roundAll: 3,
      })
    ).toBe(true);
  });

  it("answers stall topup candidates from the same entry", () => {
    expect(
      runBattleStallModeAutomation({
        type: BattleStallModeEvent.READ_TOPUP_CANDIDATES,
        opt: {},
        ...topupFacts(snap({ mp: 50, sp: 50, playerBuffs: ["spiritpot"] })),
      })
    ).toEqual([11291]);
  });

  it("rejects invalid stall mode events without reading player buff state", () => {
    expect(
      runBattleStallModeAutomation({
        type: "unknown",
        opt: {},
        ...activeFacts(snap()),
      })
    ).toBeUndefined();
    expect(runBattleStallModeAutomation(null)).toBeUndefined();
    expect(mocks.runBattlePlayerBuffState).not.toHaveBeenCalled();
  });
});
