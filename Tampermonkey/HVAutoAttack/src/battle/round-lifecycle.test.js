import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleRoundLifecycleEvent, runBattleRoundLifecycle } from "./round-lifecycle.js";

const mocks = vi.hoisted(() => ({
  runAutoTuneAutomation: vi.fn(),
  runBattleSkillUsageAutomation: vi.fn(),
  runBattleTurnAutomation: vi.fn(),
  runMonsterKnowledgeAutomation: vi.fn(),
}));

vi.mock("../state/auto-tune.js", () => ({
  AutoTuneEvent: Object.freeze({ ROUND_STARTED: "roundStarted" }),
  runAutoTuneAutomation: mocks.runAutoTuneAutomation,
}));
vi.mock("../state/battle-turn.js", () => ({
  BattleTurnEvent: Object.freeze({ ROUND_STARTED: "roundStarted" }),
  runBattleTurnAutomation: mocks.runBattleTurnAutomation,
}));
vi.mock("./battle-skill-usage.js", () => ({
  BattleSkillUsageEvent: Object.freeze({ RESET_ROUND: "resetRound" }),
  runBattleSkillUsageAutomation: mocks.runBattleSkillUsageAutomation,
}));
vi.mock("./monster-knowledge-automation.js", () => ({
  MonsterKnowledgeEvent: Object.freeze({ ROUND_STARTED: "roundStarted" }),
  runMonsterKnowledgeAutomation: mocks.runMonsterKnowledgeAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runBattleTurnAutomation.mockReturnValue(0);
});

describe("runBattleRoundLifecycle", () => {
  it("starts a new round lifecycle before round preparation", () => {
    expect(runBattleRoundLifecycle({ type: BattleRoundLifecycleEvent.ROUND_STARTED })).toBe(0);

    expect(mocks.runAutoTuneAutomation).toHaveBeenCalledWith({ type: "roundStarted" });
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledWith({ type: "roundStarted" });
    expect(mocks.runBattleSkillUsageAutomation).not.toHaveBeenCalled();
  });

  it("marks a prepared round ready for per-round consumers", () => {
    expect(runBattleRoundLifecycle({ type: BattleRoundLifecycleEvent.ROUND_READY })).toBe(true);

    expect(mocks.runBattleSkillUsageAutomation).toHaveBeenCalledWith({ type: "resetRound" });
    expect(mocks.runMonsterKnowledgeAutomation).toHaveBeenCalledWith({ type: "roundStarted" });
    expect(mocks.runAutoTuneAutomation).not.toHaveBeenCalled();
  });

  it("ignores unknown lifecycle events", () => {
    expect(runBattleRoundLifecycle({ type: "unknown" })).toBeUndefined();
  });
});
