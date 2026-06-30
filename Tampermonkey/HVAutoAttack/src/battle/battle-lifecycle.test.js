import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleLifecycleEvent, runBattleLifecycleAutomation } from "./battle-lifecycle.js";

const mocks = vi.hoisted(() => ({
  runBattleMonitorAutomation: vi.fn(),
  runBattleStartRuntimeAutomation: vi.fn(),
  runMonsterKnowledgeAutomation: vi.fn(),
}));

vi.mock("../monitor/battle-monitor-automation.js", () => ({
  BattleMonitorEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runBattleMonitorAutomation: mocks.runBattleMonitorAutomation,
}));

vi.mock("./battle-start-runtime.js", () => ({
  BattleStartRuntimeEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runBattleStartRuntimeAutomation: mocks.runBattleStartRuntimeAutomation,
}));

vi.mock("./monster-knowledge-automation.js", () => ({
  MonsterKnowledgeEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runMonsterKnowledgeAutomation: mocks.runMonsterKnowledgeAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
});

describe("runBattleLifecycleAutomation", () => {
  it("starts battle runtime before battle knowledge and monitor exits", () => {
    expect(runBattleLifecycleAutomation({ type: BattleLifecycleEvent.BATTLE_STARTED })).toBe(true);

    expect(mocks.runBattleStartRuntimeAutomation).toHaveBeenCalledWith({
      type: "battleStarted",
    });
    expect(mocks.runMonsterKnowledgeAutomation).toHaveBeenCalledWith({
      type: "battleStarted",
    });
    expect(mocks.runBattleMonitorAutomation).toHaveBeenCalledWith({
      type: "battleStarted",
    });
    expect(mocks.runBattleStartRuntimeAutomation.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runMonsterKnowledgeAutomation.mock.invocationCallOrder[0]
    );
    expect(mocks.runMonsterKnowledgeAutomation.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runBattleMonitorAutomation.mock.invocationCallOrder[0]
    );
  });

  it("rejects unknown events", () => {
    expect(runBattleLifecycleAutomation({ type: "unknown" })).toBe(false);
  });
});
