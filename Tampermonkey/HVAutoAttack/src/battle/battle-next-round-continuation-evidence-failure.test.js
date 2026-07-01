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

describe("next-round continuation evidence failures", () => {
  it("keeps a restarted next-round turn accepted when continuation evidence fails once", () => {
    const deps = makeDeps();
    deps.recordContinuation
      .mockImplementationOnce(() => {
        throw new Error("continuation evidence failed");
      })
      .mockReturnValueOnce(true);

    expect(
      runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }, deps)
    ).toBe(true);

    expect(deps.runTurn).toHaveBeenCalledTimes(1);
    expect(deps.recordContinuation).toHaveBeenCalledTimes(2);
    expect(deps.recordContinuation).toHaveBeenLastCalledWith(
      { outcome: "continued", continued: "turn" },
      expect.arrayContaining([
        { step: "restartBattleRuntime", result: true },
        {
          step: "recordContinuation",
          result: false,
          reason: "nextRoundContinuationEvidenceWriteFailed",
          error: "continuation evidence failed",
        },
      ])
    );
  });

  it("keeps rejected continuations rejected when continuation evidence keeps failing", () => {
    const deps = makeDeps();
    deps.gE.mockReturnValue(null);
    deps.recordContinuation.mockImplementation(() => {
      throw new Error("continuation evidence failed");
    });

    let result;
    expect(() => {
      result = runBattleNextRoundContinuation(
        { type: BattleNextRoundContinuationEvent.CONTINUE },
        deps
      );
    }).not.toThrow();

    expect(result).toBe(false);
    expect(deps.post).not.toHaveBeenCalled();
  });
});
