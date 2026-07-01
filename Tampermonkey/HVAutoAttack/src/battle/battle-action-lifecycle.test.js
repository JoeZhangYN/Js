import { describe, expect, it, vi } from "vitest";
import {
  BattleActionLifecycleEvent,
  runBattleActionLifecycleAutomation,
} from "./battle-action-lifecycle.js";

function makeDeps({ hasCompletion = false, outcome = "ongoing" } = {}) {
  const deps = {
    startDelay: vi.fn(),
    recordSpeed: vi.fn(),
    endDelay: vi.fn(),
    refreshCombatants: vi.fn(),
    monitorActionStarted: vi.fn(),
    monitorActionEnded: vi.fn(),
    isCompletionReached: vi.fn(() => hasCompletion),
    completeBattle: vi.fn(() => ({ outcome })),
    continueNextRound: vi.fn(),
    runTurn: vi.fn(),
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

  it("continues the current battle turn when no completion pane is present", () => {
    const { deps } = makeDeps();

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({ outcome: "ongoing", continued: "turn" });

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

  it("continues the next round through the next-round entry", () => {
    const { deps } = makeDeps({
      hasCompletion: true,
      outcome: "nextRound",
    });

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({ outcome: "nextRound", continued: "nextRound" });

    expect(deps.continueNextRound).toHaveBeenCalledTimes(1);
    expect(deps.isCompletionReached).toHaveBeenCalledTimes(1);
    expect(deps.completeBattle).toHaveBeenCalledTimes(1);
    expect(deps.runTurn).not.toHaveBeenCalled();
    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      {
        outcome: "nextRound",
        continued: "nextRound",
      },
      expect.arrayContaining([
        { step: "isCompletionReached", result: true },
        { step: "completeBattle", result: "nextRound" },
        { step: "continue", result: "nextRound" },
      ])
    );
  });

  it("rejects unknown events", () => {
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
    expect(deps.recordLifecycle).not.toHaveBeenCalled();
  });
});
