import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleDecisionRuntimeEvent, runBattleDecisionRuntime } from "./battle-decision-runtime.js";

const mocks = vi.hoisted(() => ({
  runBattleProgressAutomation: vi.fn(() => ({
    monsterAlive: 3,
    roundAll: 5,
    roundNow: 2,
    roundType: "ar",
  })),
  runBattleStartRuntimeAutomation: vi.fn(() => 2),
  runBattleSpiritToggleAutomation: vi.fn(() => 97),
}));

vi.mock("./battle-progress.js", () => ({
  BattleProgressEvent: Object.freeze({ READ_CONTEXT: "readContext" }),
  runBattleProgressAutomation: mocks.runBattleProgressAutomation,
}));
vi.mock("./battle-start-runtime.js", () => ({
  BattleStartRuntimeEvent: Object.freeze({ READ_ATTACK_STATUS: "readAttackStatus" }),
  runBattleStartRuntimeAutomation: mocks.runBattleStartRuntimeAutomation,
}));
vi.mock("./battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ READ_LAST_TOGGLE: "readLastToggle" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
});

describe("runBattleDecisionRuntime", () => {
  it("reads decision runtime facts through their capability entries", () => {
    expect(runBattleDecisionRuntime({ type: BattleDecisionRuntimeEvent.READ_CURRENT })).toEqual({
      monsterAlive: 3,
      roundAll: 5,
      roundNow: 2,
      roundType: "ar",
      attackStatus: 2,
      lastSpiritToggleGlobalTurn: 97,
    });
    expect(mocks.runBattleProgressAutomation).toHaveBeenCalledWith({ type: "readContext" });
    expect(mocks.runBattleStartRuntimeAutomation).toHaveBeenCalledWith({
      type: "readAttackStatus",
    });
    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({
      type: "readLastToggle",
    });
  });

  it("returns empty runtime facts for unknown events", () => {
    expect(runBattleDecisionRuntime({ type: "unknown" })).toEqual({});

    expect(mocks.runBattleProgressAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleStartRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleSpiritToggleAutomation).not.toHaveBeenCalled();
  });
});
