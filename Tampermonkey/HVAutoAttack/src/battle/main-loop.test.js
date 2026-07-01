import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleTurnWorkflowEvent, runBattleTurnAutomation } from "./main-loop.js";

const mocks = vi.hoisted(() => ({
  runBattleTurnContext: vi.fn(),
  runBattleActionDecision: vi.fn(),
  runBattlePauseAutomation: vi.fn(),
  runBattleTurnPrelude: vi.fn(),
}));

vi.mock("./turn-context.js", () => ({
  BattleTurnContextEvent: Object.freeze({ PREPARE: "prepare" }),
  runBattleTurnContext: mocks.runBattleTurnContext,
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
  sessionStorage.clear();
  mocks.runBattleTurnContext.mockReturnValue({
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
    runBattleTurnAutomation({ type: BattleTurnWorkflowEvent.RUN_CURRENT_TURN });

    expect(mocks.runBattleTurnPrelude).toHaveBeenCalledWith({ type: "prepareCurrentTurn" });
    expect(mocks.runBattleTurnContext).toHaveBeenCalledWith({
      type: "prepare",
      logTelemetry: { battleLog: [{ kind: "player-incoming", dmg: 10 }] },
    });
    expect(mocks.runBattleActionDecision).toHaveBeenCalledWith({
      type: "decide",
      context: {
        snap: { snap: true },
        actionOptions: { ok: true },
      },
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleTurnWorkflow"))).toMatchObject({
      stage: "decisionCompleted",
    });
  });

  it("records paused turn workflow stage without running the action pipeline", () => {
    mocks.runBattlePauseAutomation.mockReturnValue(true);

    runBattleTurnAutomation({ type: BattleTurnWorkflowEvent.RUN_CURRENT_TURN });

    expect(mocks.runBattleTurnPrelude).not.toHaveBeenCalled();
    expect(mocks.runBattleTurnContext).not.toHaveBeenCalled();
    expect(mocks.runBattleActionDecision).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleTurnWorkflow"))).toMatchObject({
      stage: "paused",
      detail: { reason: "renderIfPaused" },
    });
  });

  it("records failed turn workflow stage before rethrowing", () => {
    mocks.runBattleTurnContext.mockImplementation(() => {
      throw new Error("context exploded");
    });

    expect(() =>
      runBattleTurnAutomation({ type: BattleTurnWorkflowEvent.RUN_CURRENT_TURN })
    ).toThrow("context exploded");
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleTurnWorkflow"))).toMatchObject({
      stage: "failed",
      detail: { message: "context exploded" },
    });
  });

  it("rejects unknown turn workflow events", () => {
    expect(runBattleTurnAutomation({ type: "unknown" })).toBe(false);
    expect(mocks.runBattlePauseAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleTurnPrelude).not.toHaveBeenCalled();
    expect(mocks.runBattleActionDecision).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleTurnWorkflow"))).toMatchObject({
      stage: "rejected",
      detail: { eventType: "unknown" },
    });
  });
});
