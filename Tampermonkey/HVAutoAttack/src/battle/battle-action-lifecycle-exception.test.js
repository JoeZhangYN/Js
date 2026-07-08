import { describe, expect, it, vi } from "vitest";
import {
  BattleActionLifecycleEvent,
  runBattleActionLifecycleAutomation,
} from "./battle-action-lifecycle.js";

function makeDeps() {
  return {
    startDelay: vi.fn(() => true),
    recordSpeed: vi.fn(() => true),
    endDelay: vi.fn(() => true),
    refreshCombatants: vi.fn(() => true),
    monitorActionStarted: vi.fn(() => true),
    monitorActionEnded: vi.fn(() => true),
    isCompletionReached: vi.fn(() => false),
    completeBattle: vi.fn(() => ({ outcome: "clear" })),
    continueNextRound: vi.fn(() => true),
    runTurn: vi.fn(() => true),
    recordLifecycle: vi.fn(),
  };
}

describe("battle action lifecycle step exceptions", () => {
  it("records action-start step exceptions without throwing", () => {
    const deps = makeDeps();
    deps.startDelay.mockImplementation(() => {
      throw new Error("delay exploded");
    });

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_STARTED }, deps)
    ).toBe(false);

    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionStarted",
      false,
      expect.arrayContaining([
        {
          step: "startDelay",
          result: false,
          reason: "actionLifecycleStepThrew",
          error: "delay exploded",
        },
      ])
    );
  });

  it("records completion check exceptions as rejected lifecycle results", () => {
    const deps = makeDeps();
    deps.isCompletionReached.mockImplementation(() => {
      throw new Error("completion check exploded");
    });

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({
      outcome: "rejected",
      reason: "actionLifecycleStepThrew",
      failedStep: "isCompletionReached",
    });

    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      expect.objectContaining({ outcome: "rejected", failedStep: "isCompletionReached" }),
      expect.arrayContaining([
        expect.objectContaining({
          step: "isCompletionReached",
          reason: "actionLifecycleStepThrew",
        }),
      ])
    );
  });

  it("records completeBattle exceptions as rejected lifecycle results", () => {
    const deps = makeDeps();
    deps.isCompletionReached.mockReturnValue(true);
    deps.completeBattle.mockImplementation(() => {
      throw new Error("complete exploded");
    });

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({
      outcome: "rejected",
      reason: "actionLifecycleStepThrew",
      failedStep: "completeBattle",
    });

    expect(deps.recordLifecycle).toHaveBeenCalledWith(
      "actionEnded",
      expect.objectContaining({ outcome: "rejected", failedStep: "completeBattle" }),
      expect.arrayContaining([
        expect.objectContaining({ step: "completeBattle", reason: "actionLifecycleStepThrew" }),
      ])
    );
  });

  it("keeps action-ended result when lifecycle evidence recording fails once", () => {
    const deps = makeDeps();
    deps.recordLifecycle
      .mockImplementationOnce(() => {
        throw new Error("evidence exploded");
      })
      .mockReturnValueOnce(true);

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({ outcome: "ongoing", continued: "turn", continuationStarted: true });

    expect(deps.recordLifecycle).toHaveBeenCalledTimes(2);
    expect(deps.recordLifecycle).toHaveBeenLastCalledWith(
      "actionEnded",
      { outcome: "ongoing", continued: "turn", continuationStarted: true },
      expect.arrayContaining([
        {
          step: "recordLifecycle",
          result: false,
          reason: "lifecycleEvidenceWriteFailed",
          error: "evidence exploded",
        },
      ])
    );
  });

  it("keeps action-started accepted when lifecycle evidence recording keeps failing", () => {
    const deps = makeDeps();
    deps.recordLifecycle.mockImplementation(() => {
      throw new Error("evidence exploded");
    });

    let result;
    expect(() => {
      result = runBattleActionLifecycleAutomation(
        { type: BattleActionLifecycleEvent.ACTION_STARTED },
        deps
      );
    }).not.toThrow();

    expect(result).toBe(true);
    expect(deps.recordLifecycle).toHaveBeenCalledTimes(2);
  });
});
