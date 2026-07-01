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
  sessionStorage.clear();
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
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleLifecycle"))).toMatchObject({
      phase: "battleStarted",
      result: true,
      steps: [
        { step: "startRuntime", result: true },
        { step: "startKnowledge", result: true },
        { step: "startMonitor", result: true },
      ],
    });
  });

  it("returns false and records evidence when a battle-start exit fails", () => {
    mocks.runBattleMonitorAutomation.mockReturnValue(false);

    expect(runBattleLifecycleAutomation({ type: BattleLifecycleEvent.BATTLE_STARTED })).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleLifecycle"))).toMatchObject({
      phase: "battleStarted",
      result: false,
      steps: expect.arrayContaining([{ step: "startMonitor", result: false }]),
    });
  });

  it("rejects unknown events with lifecycle evidence", () => {
    expect(runBattleLifecycleAutomation({ type: "unknown" })).toBe(false);

    expect(mocks.runBattleStartRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.runMonsterKnowledgeAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleMonitorAutomation).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleLifecycle"))).toMatchObject({
      phase: "unknownBattleLifecycleEvent",
      result: false,
      steps: [
        {
          step: "routeEvent",
          result: false,
          reason: "unknownBattleLifecycleEvent",
          eventType: "unknown",
        },
      ],
    });
  });

  it("rejects null events with lifecycle evidence instead of throwing", () => {
    expect(runBattleLifecycleAutomation(null)).toBe(false);

    expect(mocks.runBattleStartRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.runMonsterKnowledgeAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleMonitorAutomation).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleLifecycle"))).toMatchObject({
      phase: "unknownBattleLifecycleEvent",
      result: false,
      steps: [
        {
          step: "routeEvent",
          result: false,
          reason: "unknownBattleLifecycleEvent",
          eventType: null,
        },
      ],
    });
  });
});
