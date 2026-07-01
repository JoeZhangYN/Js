import { describe, expect, it, vi } from "vitest";
import {
  BattleNextRoundContinuationEvent,
  runBattleNextRoundContinuation,
} from "./battle-next-round-continuation.js";

function makeDeps() {
  const nodes = {
    "#btcp": { id: "btcp" },
    "#pane_completion": { removeChild: vi.fn() },
    "#battle_main": { replaceChild: vi.fn() },
    "#battle_right": { id: "oldRight" },
    "#battle_left": { id: "oldLeft" },
  };
  return {
    gE: vi.fn((selector, data) => data?.[selector] || nodes[selector]),
    post: vi.fn((href, cb) =>
      cb({ "#battle_right": { id: "newRight" }, "#battle_left": { id: "newLeft" } })
    ),
    href: vi.fn(() => "https://example.test/battle"),
    unsafeWindow: {
      Battle: vi.fn(function Battle() {
        this.clear_infopane = vi.fn();
      }),
      battle: null,
    },
    handleRiddle: vi.fn(() => false),
    startRound: vi.fn(() => true),
    runTurn: vi.fn(() => true),
    recordContinuation: vi.fn(),
  };
}

describe("runBattleNextRoundContinuation rejection evidence", () => {
  it("records rejected continuation when restarted turn does not act", () => {
    const deps = makeDeps();
    deps.runTurn.mockReturnValue(false);

    expect(
      runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }, deps)
    ).toBe(true);

    expect(deps.recordContinuation).toHaveBeenCalledWith(
      { outcome: "rejected", continued: false, reason: "nextRoundRestartRejected" },
      expect.arrayContaining([
        { step: "runTurn", result: false },
        { step: "restartBattleRuntime", result: false },
      ])
    );
  });

  it("records callback step exceptions without throwing", () => {
    const deps = makeDeps();
    deps.gE.mockImplementation((selector, data) => {
      if (selector === "#battle_right" && data) throw new Error("panel exploded");
      return data?.[selector] || {
        id: selector,
        removeChild: vi.fn(),
        replaceChild: vi.fn(),
      };
    });

    expect(
      runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }, deps)
    ).toBe(true);

    expect(deps.recordContinuation).toHaveBeenCalledWith(
      { outcome: "rejected", continued: false, reason: "nextRoundContinuationStepThrew" },
      expect.arrayContaining([
        expect.objectContaining({
          step: "replaceBattlePanels",
          result: false,
          reason: "nextRoundContinuationStepThrew",
          error: "panel exploded",
        }),
      ])
    );
    expect(deps.runTurn).not.toHaveBeenCalled();
  });
});
