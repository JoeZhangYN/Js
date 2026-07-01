import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleEvent, runBattleAutomation } from "./battle-automation.js";

const mocks = vi.hoisted(() => ({
  cE: vi.fn((tag) => document.createElement(tag)),
  g: vi.fn(),
  gE: vi.fn(),
  runBattleActionEventBridgeAutomation: vi.fn(),
  runBattleLifecycleAutomation: vi.fn(),
  runBattlePauseControlsAutomation: vi.fn(),
  runBattleRoundStartAutomation: vi.fn(),
  runBattleTurnAutomation: vi.fn(),
}));

vi.mock("./battle-action-event-bridge.js", () => ({
  BattleActionEventBridgeEvent: Object.freeze({ INSTALL: "install" }),
  runBattleActionEventBridgeAutomation: mocks.runBattleActionEventBridgeAutomation,
}));
vi.mock("./battle-round-start.js", () => ({
  BattleRoundStartEvent: Object.freeze({ ROUND_STARTED: "roundStarted" }),
  runBattleRoundStartAutomation: mocks.runBattleRoundStartAutomation,
}));
vi.mock("./main-loop.js", () => ({
  BattleTurnWorkflowEvent: Object.freeze({ RUN_CURRENT_TURN: "runCurrentTurn" }),
  runBattleTurnAutomation: mocks.runBattleTurnAutomation,
}));
vi.mock("./battle-pause-controls.js", () => ({
  BattlePauseControlsEvent: Object.freeze({ INSTALL: "install" }),
  runBattlePauseControlsAutomation: mocks.runBattlePauseControlsAutomation,
}));
vi.mock("./battle-lifecycle.js", () => ({
  BattleLifecycleEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runBattleLifecycleAutomation: mocks.runBattleLifecycleAutomation,
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
    expect(mocks.runBattleRoundStartAutomation).toHaveBeenCalledWith({ type: "roundStarted" });
    expect(mocks.runBattleLifecycleAutomation).toHaveBeenCalledWith({ type: "battleStarted" });
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledWith({ type: "runCurrentTurn" });
    const actualOrder = [
      mocks.runBattlePauseControlsAutomation.mock.invocationCallOrder[0],
      mocks.runBattleActionEventBridgeAutomation.mock.invocationCallOrder[0],
      mocks.runBattleRoundStartAutomation.mock.invocationCallOrder[0],
      mocks.runBattleLifecycleAutomation.mock.invocationCallOrder[0],
      mocks.runBattleTurnAutomation.mock.invocationCallOrder[0],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
    expect(mocks.runBattleRoundStartAutomation.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runBattleLifecycleAutomation.mock.invocationCallOrder[0]
    );
  });

  it("ignores unknown events", () => {
    expect(runBattleAutomation({ type: "unknown" })).toBeUndefined();
    expect(mocks.runBattleActionEventBridgeAutomation).not.toHaveBeenCalled();
  });
});
