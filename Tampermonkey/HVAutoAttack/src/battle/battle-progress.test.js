import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleProgressEvent, runBattleProgressAutomation } from "./battle-progress.js";

const mocks = vi.hoisted(() => ({
  runBattleSessionAutomation: vi.fn(),
  runMonsterStatusAutomation: vi.fn(),
}));

vi.mock("./battle-session.js", () => ({
  BattleSessionEvent: Object.freeze({ READ_CONTEXT: "readContext" }),
  runBattleSessionAutomation: mocks.runBattleSessionAutomation,
}));

vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({ READ_COMBATANT_COUNTS: "readCombatantCounts" }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runBattleSessionAutomation.mockReturnValue({
    sessionId: "session-1",
    sessionPhase: "active",
    roundNow: 2,
    roundAll: 5,
    roundType: "ar",
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
    expect(mocks.runBattleSessionAutomation).not.toHaveBeenCalled();
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
      sessionId: "session-1",
      sessionPhase: "active",
    });
    expect(mocks.runBattleSessionAutomation).toHaveBeenCalledWith({ type: "readContext" });
    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({
      type: "readCombatantCounts",
    });
  });
});
