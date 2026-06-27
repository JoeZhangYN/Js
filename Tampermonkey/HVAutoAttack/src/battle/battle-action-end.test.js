import { describe, expect, it, vi } from "vitest";
import { BattleActionEndEvent, runBattleActionEndAutomation } from "./battle-action-end.js";
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
    recordSpeed: vi.fn(),
    endDelay: vi.fn(),
    refreshCombatants: vi.fn(),
    monitorActionEnded: vi.fn(),
    monitorCompletion: vi.fn(),
    completeBattle: vi.fn(() => ({ outcome })),
    handleRiddle: vi.fn(() => false),
    startRound: vi.fn(),
    runTurn: vi.fn(),
  };
  return { deps, nodes };
}

describe("runBattleActionEndAutomation", () => {
  it("continues the current battle turn when no completion pane is present", () => {
    const { deps } = makeDeps();

    expect(runBattleActionEndAutomation({ type: BattleActionEndEvent.ACTION_ENDED }, deps)).toEqual(
      { outcome: "ongoing", continued: "turn" }
    );

    expect(deps.recordSpeed.mock.invocationCallOrder[0]).toBeLessThan(
      deps.endDelay.mock.invocationCallOrder[0]
    );
    expect(deps.refreshCombatants).toHaveBeenCalledTimes(1);
    expect(deps.monitorActionEnded).toHaveBeenCalledTimes(1);
    expect(deps.runTurn).toHaveBeenCalledTimes(1);
    expect(deps.completeBattle).not.toHaveBeenCalled();
  });

  it("loads and starts the next round through one action-end entry", () => {
    const { deps, nodes } = makeDeps({
      hasCompletion: true,
      outcome: BattleCompletionOutcome.NEXT_ROUND,
    });

    expect(runBattleActionEndAutomation({ type: BattleActionEndEvent.ACTION_ENDED }, deps)).toEqual(
      { outcome: "nextRound", continued: "nextRound" }
    );

    expect(nodes["#pane_completion"].removeChild).toHaveBeenCalledWith(nodes["#btcp"]);
    expect(deps.post).toHaveBeenCalledWith("https://example.test/battle", expect.any(Function));
    expect(nodes["#battle_main"].replaceChild).toHaveBeenCalledTimes(2);
    expect(deps.unsafeWindow.Battle).toHaveBeenCalledTimes(1);
    expect(deps.startRound).toHaveBeenCalledTimes(1);
    expect(deps.runTurn).toHaveBeenCalledTimes(1);
  });

  it("lets riddle handling claim the post result before panel replacement", () => {
    const { deps, nodes } = makeDeps({
      hasCompletion: true,
      outcome: BattleCompletionOutcome.NEXT_ROUND,
    });
    deps.handleRiddle.mockReturnValue(true);

    runBattleActionEndAutomation({ type: BattleActionEndEvent.ACTION_ENDED }, deps);

    expect(nodes["#battle_main"].replaceChild).not.toHaveBeenCalled();
    expect(deps.startRound).not.toHaveBeenCalled();
    expect(deps.runTurn).not.toHaveBeenCalled();
  });
});
