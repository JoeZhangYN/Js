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
  BattleActionDecisionEvent: Object.freeze({ DECIDE: "decide" }),
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
  mocks.runBattleTurnPrelude.mockReturnValue({
    battleLogTelemetry: { battleLog: [{ kind: "player-incoming", dmg: 10 }] },
  });
});

describe("runBattleTurnAutomation", () => {
  it("runs turn prelude before preparing and dispatching decision context", () => {
    runBattleTurnAutomation();

    expect(mocks.runBattleTurnPrelude).toHaveBeenCalledWith({ type: "prepareCurrentTurn" });
    expect(mocks.prepareBattleTurnContext).toHaveBeenCalledWith({
      logTelemetry: { battleLog: [{ kind: "player-incoming", dmg: 10 }] },
    });
    expect(mocks.runBattleActionDecision).toHaveBeenCalledWith({
      type: "decide",
      context: {
        snap: { snap: true },
        actionOptions: { ok: true },
      },
    });
  });
});
