import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleEvent, runBattleAutomation } from "./battle-automation.js";

const mocks = vi.hoisted(() => ({
  cE: vi.fn((tag) => document.createElement(tag)),
  g: vi.fn(),
  gE: vi.fn(),
  runBattleActionEventBridgeAutomation: vi.fn(),
  runBattleLifecycleAutomation: vi.fn(),
  runBattleLearningRuntime: vi.fn(),
  runBattlePauseControlsAutomation: vi.fn(),
  runBattleRoundStartAutomation: vi.fn(),
  runBattleTurnAutomation: vi.fn(),
}));

vi.mock("./battle-learning-runtime.js", () => ({
  BattleLearningRuntimeEvent: Object.freeze({ HYDRATE: "hydrate" }),
  runBattleLearningRuntime: mocks.runBattleLearningRuntime,
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
  window.sessionStorage.clear();
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.gE.mockImplementation((selector) => document.querySelector(selector));
  mocks.runBattleActionEventBridgeAutomation.mockReturnValue(undefined);
  mocks.runBattleLearningRuntime.mockResolvedValue(true);
});

describe("runBattleAutomation", () => {
  it("starts battle page capabilities through the event entry", async () => {
    await expect(runBattleAutomation({ type: BattleEvent.PAGE_READY })).resolves.toBe(true);

    expect(mocks.runBattleLearningRuntime).toHaveBeenCalledWith({ type: "hydrate" });
    expect(mocks.runBattleLearningRuntime.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runBattlePauseControlsAutomation.mock.invocationCallOrder[0]
    );
    expect(mocks.runBattlePauseControlsAutomation).toHaveBeenCalledWith({ type: "install" });
    expect(mocks.runBattleActionEventBridgeAutomation).toHaveBeenCalledWith({ type: "install" });
    expect(mocks.runBattleLifecycleAutomation).toHaveBeenCalledWith({ type: "battleStarted" });
    expect(mocks.runBattleRoundStartAutomation).toHaveBeenCalledWith({ type: "roundStarted" });
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledWith({ type: "runCurrentTurn" });
    const actualOrder = [
      mocks.runBattlePauseControlsAutomation.mock.invocationCallOrder[0],
      mocks.runBattleActionEventBridgeAutomation.mock.invocationCallOrder[0],
      mocks.runBattleLifecycleAutomation.mock.invocationCallOrder[0],
      mocks.runBattleRoundStartAutomation.mock.invocationCallOrder[0],
      mocks.runBattleTurnAutomation.mock.invocationCallOrder[0],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
    expect(mocks.runBattleLifecycleAutomation.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runBattleRoundStartAutomation.mock.invocationCallOrder[0]
    );
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleAutomation"))).toMatchObject({
      phase: "pageReady",
      result: true,
      steps: [
        { capability: "learningRuntime", result: true },
        { capability: "pauseControls", result: true },
        { capability: "actionEventBridge", result: true },
        { capability: "battleStarted", result: true },
        { capability: "roundStarted", result: true },
        { capability: "initialBattleTurn", result: true },
      ],
    });
  });

  it("records failed startup steps without claiming page startup succeeded", async () => {
    mocks.runBattleActionEventBridgeAutomation.mockReturnValue(false);

    await expect(runBattleAutomation({ type: BattleEvent.PAGE_READY })).resolves.toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleAutomation"))).toMatchObject({
      phase: "pageReady",
      result: false,
      steps: [
        { capability: "learningRuntime", result: true },
        { capability: "pauseControls", result: true },
        { capability: "actionEventBridge", result: false },
        { capability: "battleStarted", result: true },
        { capability: "roundStarted", result: true },
        { capability: "initialBattleTurn", result: true },
      ],
    });
  });

  it("does not treat typed failed startup steps as successful", async () => {
    const detail = { kind: "failed", reason: "battleStartFailed" };
    mocks.runBattleLifecycleAutomation.mockReturnValue(detail);

    await expect(runBattleAutomation({ type: BattleEvent.PAGE_READY })).resolves.toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleAutomation"))).toMatchObject({
      phase: "pageReady",
      result: false,
      steps: expect.arrayContaining([{ capability: "battleStarted", result: false, detail }]),
    });
  });

  it("rejects unknown events with structured startup evidence", () => {
    expect(runBattleAutomation({ type: "unknown" })).toBe(false);
    expect(mocks.runBattleActionEventBridgeAutomation).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleAutomation"))).toMatchObject({
      phase: "unknownBattleAutomationEvent",
      result: {
        outcome: "rejected",
        reason: "unknownBattleAutomationEvent",
        eventType: "unknown",
      },
      steps: [
        {
          capability: "routeEvent",
          result: false,
          reason: "unknownBattleAutomationEvent",
          eventType: "unknown",
        },
      ],
    });
  });

  it("rejects null events without starting battle page capabilities", () => {
    expect(runBattleAutomation(null)).toBe(false);
    expect(mocks.runBattlePauseControlsAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleActionEventBridgeAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleRoundStartAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleLifecycleAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleTurnAutomation).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleAutomation"))).toMatchObject({
      phase: "unknownBattleAutomationEvent",
      result: {
        outcome: "rejected",
        reason: "unknownBattleAutomationEvent",
        eventType: null,
      },
    });
  });
});
