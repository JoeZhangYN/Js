import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDecisionEvent, runBattleActionDecision } from "./battle-action-decision.js";

const mocks = vi.hoisted(() => ({
  runBattleActionEffectDispatch: vi.fn(),
  runBattleActionDecisionEvidence: vi.fn(),
}));

vi.mock("./battle-action-effect-dispatch.js", () => ({
  BattleActionEffectDispatchEvent: { APPLY_ACTION_RESULT: "applyActionResult" },
  runBattleActionEffectDispatch: mocks.runBattleActionEffectDispatch,
}));
vi.mock("./battle-action-decision-evidence.js", () => ({
  BattleActionDecisionEvidenceEvent: { RECORD_TRACE: "recordTrace" },
  runBattleActionDecisionEvidence: mocks.runBattleActionDecisionEvidence,
}));

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.runBattleActionEffectDispatch.mockReset();
  mocks.runBattleActionDecisionEvidence.mockReset();
});

describe("runBattleActionDecision evidence failures", () => {
  it("keeps acted decisions acted when decision evidence recording fails once", () => {
    mocks.runBattleActionEffectDispatch.mockReturnValue(true);
    mocks.runBattleActionDecisionEvidence
      .mockImplementationOnce(() => {
        throw new Error("decision evidence failed");
      })
      .mockReturnValue(true);

    expect(
      runBattleActionDecision({
        type: BattleActionDecisionEvent.DECIDE,
        context: { snap: {}, actionOptions: { autoFlee: true } },
      })
    ).toBe(true);

    expect(mocks.runBattleActionDecisionEvidence).toHaveBeenLastCalledWith({
      type: "recordTrace",
      steps: expect.arrayContaining([
        expect.objectContaining({
          result: {
            kind: "decision-evidence-event",
            reason: "actionDecisionEvidenceWriteFailed",
            error: "decision evidence failed",
          },
          acted: false,
        }),
      ]),
    });
  });

  it("does not throw when decision evidence recording keeps failing", () => {
    mocks.runBattleActionEffectDispatch.mockReturnValue(true);
    mocks.runBattleActionDecisionEvidence.mockImplementation(() => {
      throw new Error("decision evidence failed");
    });

    expect(() =>
      runBattleActionDecision({
        type: BattleActionDecisionEvent.DECIDE,
        context: { snap: {}, actionOptions: { autoFlee: true } },
      })
    ).not.toThrow();
  });
});
