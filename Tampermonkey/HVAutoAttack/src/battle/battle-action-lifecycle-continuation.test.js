import { describe, expect, it, vi } from "vitest";
import {
  BattleActionLifecycleEvent,
  runBattleActionLifecycleAutomation,
} from "./battle-action-lifecycle.js";

function makeDeps() {
  return {
    recordSpeed: vi.fn(),
    endDelay: vi.fn(),
    refreshCombatants: vi.fn(),
    finalizeUtilityObservation: vi.fn(),
    monitorActionEnded: vi.fn(),
    isCompletionReached: vi.fn(() => true),
    completeBattle: vi.fn(() => ({ outcome: "nextRound" })),
    continueNextRound: vi.fn(() => true),
    runTurn: vi.fn(),
    recordLifecycle: vi.fn(),
  };
}

describe("battle action lifecycle next-round continuation evidence", () => {
  it("records when next-round continuation starts", () => {
    const deps = makeDeps();

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({ outcome: "nextRound", continued: "nextRound", continuationStarted: true });

    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      { outcome: "nextRound", continued: "nextRound", continuationStarted: true },
      expect.arrayContaining([{ step: "continue", result: true, continued: "nextRound" }])
    );
    expect(deps.runTurn).not.toHaveBeenCalled();
  });

  it("records failed next-round continuation start without claiming it succeeded", () => {
    const deps = makeDeps();
    deps.continueNextRound.mockReturnValue(false);

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({ outcome: "nextRound", continued: "nextRound", continuationStarted: false });

    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      { outcome: "nextRound", continued: "nextRound", continuationStarted: false },
      expect.arrayContaining([{ step: "continue", result: false, continued: "nextRound" }])
    );
  });
});
