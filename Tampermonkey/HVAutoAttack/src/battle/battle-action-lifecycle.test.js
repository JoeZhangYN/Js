import { describe, expect, it, vi } from "vitest";
import {
  BattleActionLifecycleEvent,
  runBattleActionLifecycleAutomation,
} from "./battle-action-lifecycle.js";
import { BattleCompletionOutcome } from "./battle-completion.js";

function makeDeps({ hasCompletion = false, outcome = BattleCompletionOutcome.ONGOING } = {}) {
  const nodes = {
    "#btcp": hasCompletion ? { id: "btcp" } : null,
    "#pane_completion": { removeChild: vi.fn() },
    "#battle_main": { replaceChild: vi.fn() },
    "#battle_right": { id: "oldRight" },
    "#battle_left": { id: "oldLeft" },
  };
  const deps = {
    gE: vi.fn((selector, data) => data?.[selector] || nodes[selector]),
    post: vi.fn((href, cb) =>
      cb({
        "#battle_right": { id: "newRight" },
        "#battle_left": { id: "newLeft" },
      })
    ),
    href: vi.fn(() => "https://example.test/battle"),
    unsafeWindow: {
      Battle: vi.fn(function Battle() {
        this.clear_infopane = vi.fn();
      }),
      battle: null,
    },
    startDelay: vi.fn(),
    recordSpeed: vi.fn(),
    endDelay: vi.fn(),
    refreshCombatants: vi.fn(),
    monitorActionStarted: vi.fn(),
    monitorActionEnded: vi.fn(),
    completeBattle: vi.fn(() => ({ outcome })),
    continueNextRound: vi.fn(),
    runTurn: vi.fn(),
  };
  return { deps, nodes };
}

describe("runBattleActionLifecycleAutomation", () => {
  it("starts action delay before monitor action tracking", () => {
    const { deps } = makeDeps();

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_STARTED }, deps)
    ).toBe(true);

    expect(deps.startDelay).toHaveBeenCalledTimes(1);
    expect(deps.monitorActionStarted).toHaveBeenCalledTimes(1);
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
    expect(deps.runTurn).toHaveBeenCalledTimes(1);
    expect(deps.completeBattle).not.toHaveBeenCalled();
  });

  it("continues the next round through the next-round entry", () => {
    const { deps } = makeDeps({
      hasCompletion: true,
      outcome: BattleCompletionOutcome.NEXT_ROUND,
    });

    expect(
      runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED }, deps)
    ).toEqual({ outcome: "nextRound", continued: "nextRound" });

    expect(deps.continueNextRound).toHaveBeenCalledTimes(1);
    expect(deps.runTurn).not.toHaveBeenCalled();
  });

  it("rejects unknown events", () => {
    const { deps } = makeDeps();

    expect(runBattleActionLifecycleAutomation({ type: "unknown" }, deps)).toBe(false);
  });
});
