import { describe, expect, it, vi } from "vitest";
import {
  BattleActionLifecycleEvent,
  runBattleActionLifecycleAutomation,
} from "./battle-action-lifecycle.js";

function makeDeps() {
  return {
    recordSpeed: vi.fn(),
    endDelay: vi.fn(),
    refreshCombatants: vi.fn(() => false),
    finalizeUtilityObservation: vi.fn(),
    monitorActionEnded: vi.fn(),
    isCompletionReached: vi.fn(() => false),
    completeBattle: vi.fn(),
    continueNextRound: vi.fn(),
    runTurn: vi.fn(() => false),
    recordLifecycle: vi.fn(),
  };
}

describe("battle action lifecycle step result evidence", () => {
  it("records actual lifecycle step results when a dependency reports false", () => {
    const deps = makeDeps();

    runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps);

    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      { outcome: "ongoing", continued: "turn", continuationStarted: false },
      expect.arrayContaining([
        { step: "refreshCombatants", result: false },
        { step: "runTurn", result: false },
      ])
    );
  });

  it("records ongoing turn continuation as started when runTurn acted", () => {
    const deps = makeDeps();
    deps.runTurn.mockReturnValue(true);

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({ outcome: "ongoing", continued: "turn", continuationStarted: true });

    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      { outcome: "ongoing", continued: "turn", continuationStarted: true },
      expect.arrayContaining([{ step: "runTurn", result: true }])
    );
  });

  it("does not treat typed failed lifecycle step results as successful", () => {
    const deps = makeDeps();
    const detail = { kind: "failed", drop: { kind: "failed", reason: "dropArchiveFailed" } };
    deps.monitorActionEnded.mockReturnValue(detail);

    runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps);

    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      { outcome: "ongoing", continued: "turn", continuationStarted: false },
      expect.arrayContaining([{ step: "monitorActionEnded", result: false, detail }])
    );
  });
});
