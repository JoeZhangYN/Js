import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleProgressEvent, runBattleProgressAutomation } from "./battle-progress.js";

const mocks = vi.hoisted(() => ({
  runBattleRoundAutomation: vi.fn(),
  runMonsterStatusAutomation: vi.fn(),
}));

vi.mock("./battle-round.js", () => ({
  BattleRoundEvent: Object.freeze({
    READ_RUNTIME: "readRuntime",
    READ_TYPE: "readType",
  }),
  runBattleRoundAutomation: mocks.runBattleRoundAutomation,
}));

vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({ READ_COMBATANT_COUNTS: "readCombatantCounts" }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runBattleRoundAutomation.mockImplementation((event) => {
    if (event.type === "readRuntime") return { roundNow: 2, roundAll: 5 };
    if (event.type === "readType") return "ar";
    return undefined;
  });
  mocks.runMonsterStatusAutomation.mockReturnValue({
    bossAlive: 1,
    bossAll: 1,
    monsterAlive: 3,
    monsterAll: 4,
  });
});

describe("runBattleProgressAutomation", () => {
  it("rejects invalid progress events without reading battle facts", () => {
    expect(runBattleProgressAutomation({ type: "unknown" })).toBeUndefined();
    expect(runBattleProgressAutomation(null)).toBeUndefined();
    expect(mocks.runBattleRoundAutomation).not.toHaveBeenCalled();
    expect(mocks.runMonsterStatusAutomation).not.toHaveBeenCalled();
  });

  it("combines round and combatant facts behind one progress query", () => {
    expect(runBattleProgressAutomation({ type: BattleProgressEvent.READ_CONTEXT })).toEqual({
      bossAlive: 1,
      bossAll: 1,
      monsterAlive: 3,
      monsterAll: 4,
      roundAll: 5,
      roundNow: 2,
      roundType: "ar",
    });
    expect(mocks.runBattleRoundAutomation).toHaveBeenCalledWith({ type: "readRuntime" });
    expect(mocks.runBattleRoundAutomation).toHaveBeenCalledWith({ type: "readType" });
    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({
      type: "readCombatantCounts",
    });
  });
});
