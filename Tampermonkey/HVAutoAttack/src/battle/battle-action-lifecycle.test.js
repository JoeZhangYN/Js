import { describe, expect, it, vi } from "vitest";
import {
  BattleActionLifecycleEvent,
  runBattleActionLifecycleAutomation,
} from "./battle-action-lifecycle.js";

function makeDeps({ hasCompletion = false, outcome = "ongoing" } = {}) {
  const deps = {
    startDelay: vi.fn(() => true),
    recordSpeed: vi.fn(() => true),
    endDelay: vi.fn(() => true),
    refreshCombatants: vi.fn(() => true),
    monitorActionStarted: vi.fn(() => true),
    monitorActionEnded: vi.fn(() => true),
    isCompletionReached: vi.fn(() => hasCompletion),
    completeBattle: vi.fn(() => ({ outcome })),
    continueNextRound: vi.fn(() => true),
    runTurn: vi.fn(() => true),
    recordLifecycle: vi.fn(),
  };
  return { deps };
}

describe("runBattleActionLifecycleAutomation", () => {
  it("starts action delay before monitor action tracking", () => {
    const { deps } = makeDeps();

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_STARTED }, deps)
    ).toBe(true);

    expect(deps.startDelay).toHaveBeenCalledTimes(1);
    expect(deps.monitorActionStarted).toHaveBeenCalledTimes(1);
    expect(deps.recordLifecycle).toHaveBeenCalledWith("actionStarted", true, [
      { step: "startDelay", result: true },
      { step: "monitorActionStarted", result: true },
    ]);
    expect(deps.startDelay.mock.invocationCallOrder[0]).toBeLessThan(
      deps.monitorActionStarted.mock.invocationCallOrder[0]
    );
  });

  it("records failed action start steps without claiming action start succeeded", () => {
    const { deps } = makeDeps();
    deps.startDelay.mockReturnValue(false);

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_STARTED }, deps)
    ).toBe(false);

    expect(deps.recordLifecycle).toHaveBeenCalledWith("actionStarted", false, [
      { step: "startDelay", result: false },
      { step: "monitorActionStarted", result: true },
    ]);
  });

  it("continues the current battle turn when no completion pane is present", () => {
    const { deps } = makeDeps();

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({ outcome: "ongoing", continued: "turn", continuationStarted: true });

    expect(deps.recordSpeed.mock.invocationCallOrder[0]).toBeLessThan(
      deps.endDelay.mock.invocationCallOrder[0]
    );
    expect(deps.refreshCombatants).toHaveBeenCalledTimes(1);
    expect(deps.monitorActionEnded).toHaveBeenCalledTimes(1);
    expect(deps.isCompletionReached).toHaveBeenCalledTimes(1);
    expect(deps.runTurn).toHaveBeenCalledTimes(1);
    expect(deps.completeBattle).not.toHaveBeenCalled();
    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      {
        outcome: "ongoing",
        continued: "turn",
        continuationStarted: true,
      },
      [
        { step: "recordSpeed", result: true },
        { step: "endDelay", result: true },
        { step: "refreshCombatants", result: true },
        { step: "monitorActionEnded", result: true },
        { step: "isCompletionReached", result: false },
        { step: "runTurn", result: true },
      ]
    );
  });

  it("rejects unknown events with structured lifecycle evidence", () => {
    const { deps } = makeDeps();

    expect(runBattleActionLifecycleAutomation({ type: "unknown" }, deps)).toBe(false);
    expect(deps.startDelay).not.toHaveBeenCalled();
    expect(deps.recordSpeed).not.toHaveBeenCalled();
    expect(deps.endDelay).not.toHaveBeenCalled();
    expect(deps.monitorActionStarted).not.toHaveBeenCalled();
    expect(deps.monitorActionEnded).not.toHaveBeenCalled();
    expect(deps.isCompletionReached).not.toHaveBeenCalled();
    expect(deps.completeBattle).not.toHaveBeenCalled();
    expect(deps.continueNextRound).not.toHaveBeenCalled();
    expect(deps.runTurn).not.toHaveBeenCalled();
    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "unknownActionLifecycleEvent",
      {
        outcome: "rejected",
        reason: "unknownActionLifecycleEvent",
        eventType: "unknown",
      },
      [
        {
          step: "routeEvent",
          result: false,
          reason: "unknownActionLifecycleEvent",
          eventType: "unknown",
        },
      ]
    );
  });

  it("rejects null events with structured lifecycle evidence instead of throwing", () => {
    const { deps } = makeDeps();

    expect(runBattleActionLifecycleAutomation(null, deps)).toBe(false);
    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "unknownActionLifecycleEvent",
      {
        outcome: "rejected",
        reason: "unknownActionLifecycleEvent",
        eventType: null,
      },
      [
        {
          step: "routeEvent",
          result: false,
          reason: "unknownActionLifecycleEvent",
          eventType: null,
        },
      ]
    );
  });
});
