import { beforeEach, describe, expect, it, vi } from "vitest";
import { runBattleTurnAutomation } from "./main-loop.js";

const mocks = vi.hoisted(() => ({
  prepareBattleTurnContext: vi.fn(),
  runBattleActionDecision: vi.fn(),
  runBattlePauseAutomation: vi.fn(),
  runBattleTurnPrelude: vi.fn(),
}));

vi.mock("./turn-context.js", () => ({
  prepareBattleTurnContext: mocks.prepareBattleTurnContext,
}));
vi.mock("./pause-automation.js", () => ({
  BattlePauseEvent: Object.freeze({ RENDER_IF_PAUSED: "renderIfPaused" }),
  runBattlePauseAutomation: mocks.runBattlePauseAutomation,
}));
vi.mock("./battle-action-decision.js", () => ({
  runBattleActionDecision: mocks.runBattleActionDecision,
}));
vi.mock("./battle-turn-prelude.js", () => ({
  BattleTurnPreludeEvent: Object.freeze({ PREPARE_CURRENT_TURN: "prepareCurrentTurn" }),
  runBattleTurnPrelude: mocks.runBattleTurnPrelude,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.prepareBattleTurnContext.mockReturnValue({
    snap: { snap: true },
    actionOptions: { ok: true },
  });
  mocks.runBattlePauseAutomation.mockReturnValue(false);
});

describe("runBattleTurnAutomation", () => {
  it("runs turn prelude before preparing and dispatching decision context", () => {
    runBattleTurnAutomation();

    expect(mocks.runBattleTurnPrelude).toHaveBeenCalledWith({ type: "prepareCurrentTurn" });
    expect(mocks.prepareBattleTurnContext).toHaveBeenCalledWith();
    expect(mocks.runBattleActionDecision).toHaveBeenCalledWith({
      snap: { snap: true },
      actionOptions: { ok: true },
    });
  });
});
