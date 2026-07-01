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
  const deps = {
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
    startRound: vi.fn(),
    runTurn: vi.fn(),
    recordContinuation: vi.fn(),
  };
  return { deps, nodes };
}

describe("runBattleNextRoundContinuation", () => {
  it("loads the next round and restarts battle runtime through one entry", () => {
    const { deps, nodes } = makeDeps();

    expect(
      runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }, deps)
    ).toBe(true);

    expect(nodes["#pane_completion"].removeChild).toHaveBeenCalledWith(nodes["#btcp"]);
    expect(deps.post).toHaveBeenCalledWith("https://example.test/battle", expect.any(Function));
    expect(nodes["#battle_main"].replaceChild).toHaveBeenCalledTimes(2);
    expect(deps.unsafeWindow.Battle).toHaveBeenCalledTimes(1);
    expect(deps.startRound).toHaveBeenCalledTimes(1);
    expect(deps.runTurn).toHaveBeenCalledTimes(1);
    expect(deps.recordContinuation).toHaveBeenCalledWith(
      { outcome: "continued", continued: "turn" },
      expect.arrayContaining([
        { step: "removeCompletionButton", result: true },
        { step: "postCallback", result: true },
        { step: "handleRiddle", result: false },
        { step: "replaceBattlePanels", result: true },
        { step: "restartBattleRuntime", result: true },
      ])
    );
  });

  it("lets riddle handling claim the post result before panel replacement", () => {
    const { deps, nodes } = makeDeps();
    deps.handleRiddle.mockReturnValue(true);

    runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }, deps);

    expect(nodes["#battle_main"].replaceChild).not.toHaveBeenCalled();
    expect(deps.startRound).not.toHaveBeenCalled();
    expect(deps.runTurn).not.toHaveBeenCalled();
    expect(deps.recordContinuation).toHaveBeenCalledWith(
      { outcome: "riddle", continued: false },
      expect.arrayContaining([{ step: "handleRiddle", result: true }])
    );
  });

  it("rejects unknown next-round continuation events without side effects", () => {
    const { deps, nodes } = makeDeps();

    expect(runBattleNextRoundContinuation({ type: "unknown" }, deps)).toBe(false);
    expect(nodes["#pane_completion"].removeChild).not.toHaveBeenCalled();
    expect(deps.post).not.toHaveBeenCalled();
    expect(nodes["#battle_main"].replaceChild).not.toHaveBeenCalled();
    expect(deps.unsafeWindow.Battle).not.toHaveBeenCalled();
    expect(deps.startRound).not.toHaveBeenCalled();
    expect(deps.runTurn).not.toHaveBeenCalled();
    expect(deps.recordContinuation).toHaveBeenCalledWith(
      { outcome: "rejected", continued: false, reason: "unknownNextRoundContinuationEvent", detail: { eventType: "unknown" } },
      []
    );
  });

  it("rejects null next-round continuation events without side effects", () => {
    const { deps, nodes } = makeDeps();

    expect(runBattleNextRoundContinuation(null, deps)).toBe(false);
    expect(nodes["#pane_completion"].removeChild).not.toHaveBeenCalled();
    expect(deps.post).not.toHaveBeenCalled();
    expect(nodes["#battle_main"].replaceChild).not.toHaveBeenCalled();
    expect(deps.unsafeWindow.Battle).not.toHaveBeenCalled();
    expect(deps.startRound).not.toHaveBeenCalled();
    expect(deps.runTurn).not.toHaveBeenCalled();
    expect(deps.recordContinuation).toHaveBeenCalledWith(
      { outcome: "rejected", continued: false, reason: "unknownNextRoundContinuationEvent", detail: { eventType: null } },
      []
    );
  });

  it("rejects missing next-round completion controls with lifecycle evidence", () => {
    const { deps } = makeDeps();
    deps.gE.mockImplementation((selector) => (selector === "#pane_completion" ? null : { id: "btcp" }));

    expect(
      runBattleNextRoundContinuation({ type: BattleNextRoundContinuationEvent.CONTINUE }, deps)
    ).toBe(false);

    expect(deps.post).not.toHaveBeenCalled();
    expect(deps.startRound).not.toHaveBeenCalled();
    expect(deps.runTurn).not.toHaveBeenCalled();
    expect(deps.recordContinuation).toHaveBeenCalledWith(
      { outcome: "rejected", continued: false, reason: "missingCompletionControl", detail: { hasPane: false, hasButton: true } },
      []
    );
  });
});
