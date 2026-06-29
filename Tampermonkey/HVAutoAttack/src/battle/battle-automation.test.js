import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleEvent, runBattleAutomation } from "./battle-automation.js";

const mocks = vi.hoisted(() => ({
  cE: vi.fn((tag) => document.createElement(tag)),
  g: vi.fn(),
  gE: vi.fn(),
  runBattleActionEventBridgeAutomation: vi.fn(),
  runBattleMonitorAutomation: vi.fn(),
  runBattlePauseControlsAutomation: vi.fn(),
  runBattleRoundStartAutomation: vi.fn(),
  runBattleTurnAutomation: vi.fn(),
  runMonsterKnowledgeAutomation: vi.fn(),
  runBattleStartRuntimeAutomation: vi.fn(),
}));

vi.mock("./battle-action-event-bridge.js", () => ({
  BattleActionEventBridgeEvent: Object.freeze({ INSTALL: "install" }),
  runBattleActionEventBridgeAutomation: mocks.runBattleActionEventBridgeAutomation,
}));
vi.mock("./new-round.js", () => ({
  BattleRoundStartEvent: Object.freeze({ ROUND_STARTED: "roundStarted" }),
  runBattleRoundStartAutomation: mocks.runBattleRoundStartAutomation,
}));
vi.mock("./main-loop.js", () => ({ runBattleTurnAutomation: mocks.runBattleTurnAutomation }));
vi.mock("./battle-pause-controls.js", () => ({
  BattlePauseControlsEvent: Object.freeze({ INSTALL: "install" }),
  runBattlePauseControlsAutomation: mocks.runBattlePauseControlsAutomation,
}));
vi.mock("./monster-knowledge-automation.js", () => ({
  MonsterKnowledgeEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runMonsterKnowledgeAutomation: mocks.runMonsterKnowledgeAutomation,
}));
vi.mock("../monitor/battle-monitor-automation.js", () => ({
  BattleMonitorEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runBattleMonitorAutomation: mocks.runBattleMonitorAutomation,
}));
vi.mock("./battle-start-runtime.js", () => ({
  BattleStartRuntimeEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runBattleStartRuntimeAutomation: mocks.runBattleStartRuntimeAutomation,
}));

beforeEach(() => {
  document.body.innerHTML = '<div id="battle_main"></div>';
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.gE.mockImplementation((selector) => document.querySelector(selector));
});

describe("runBattleAutomation", () => {
  it("starts battle page capabilities through the event entry", () => {
    runBattleAutomation({ type: BattleEvent.PAGE_READY });

    expect(mocks.runBattlePauseControlsAutomation).toHaveBeenCalledWith({ type: "install" });
    expect(mocks.runBattleActionEventBridgeAutomation).toHaveBeenCalledWith({ type: "install" });
    expect(mocks.runBattleStartRuntimeAutomation).toHaveBeenCalledWith({ type: "battleStarted" });
    expect(mocks.runBattleRoundStartAutomation).toHaveBeenCalledWith({ type: "roundStarted" });
    expect(mocks.runMonsterKnowledgeAutomation).toHaveBeenCalledWith({ type: "battleStarted" });
    expect(mocks.runBattleMonitorAutomation).toHaveBeenCalledWith({ type: "battleStarted" });
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledTimes(1);
  });

  it("ignores unknown events", () => {
    expect(runBattleAutomation({ type: "unknown" })).toBeUndefined();
    expect(mocks.runBattleActionEventBridgeAutomation).not.toHaveBeenCalled();
  });
});
