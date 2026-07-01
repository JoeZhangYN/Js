import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleTurnWorkflowEvent, runBattleTurnAutomation } from "./main-loop.js";

const mocks = vi.hoisted(() => ({
  runBattleTurnContext: vi.fn(),
  runBattleActionDecision: vi.fn(),
  runBattlePauseAutomation: vi.fn(),
  runBattleTurnPrelude: vi.fn(),
  runBattleTurnWorkflowEvidence: vi.fn(),
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
vi.mock("./battle-turn-workflow-evidence.js", () => ({
  BattleTurnWorkflowEvidenceEvent: Object.freeze({ RECORD_STAGE: "recordStage" }),
  runBattleTurnWorkflowEvidence: mocks.runBattleTurnWorkflowEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  sessionStorage.clear();
  mocks.runBattleTurnContext.mockReturnValue({ snap: {}, actionOptions: {} });
  mocks.runBattlePauseAutomation.mockReturnValue(false);
  mocks.runBattleTurnPrelude.mockReturnValue({});
});

describe("runBattleTurnAutomation workflow evidence failures", () => {
  it("continues the turn when workflow evidence recording fails once", () => {
    mocks.runBattleActionDecision.mockReturnValue(true);
    mocks.runBattleTurnWorkflowEvidence
      .mockImplementationOnce(() => {
        throw new Error("workflow evidence failed");
      })
      .mockReturnValue(true);

    expect(runBattleTurnAutomation({ type: BattleTurnWorkflowEvent.RUN_CURRENT_TURN })).toBe(true);

    expect(mocks.runBattleTurnWorkflowEvidence).toHaveBeenCalledWith({
      type: "recordStage",
      stage: "workflowEvidenceFailed",
      detail: {
        reason: "turnWorkflowEvidenceWriteFailed",
        failedStage: "started",
        message: "workflow evidence failed",
      },
    });
    expect(mocks.runBattleActionDecision).toHaveBeenCalledOnce();
  });

  it("does not throw when workflow evidence recording keeps failing", () => {
    mocks.runBattleTurnWorkflowEvidence.mockImplementation(() => {
      throw new Error("workflow evidence failed");
    });

    expect(() =>
      runBattleTurnAutomation({ type: BattleTurnWorkflowEvent.RUN_CURRENT_TURN })
    ).not.toThrow();
  });
});
