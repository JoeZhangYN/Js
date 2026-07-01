import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDecisionEvent, runBattleActionDecision } from "./battle-action-decision.js";

const mocks = vi.hoisted(() => ({
  runBattleSurvivalAction: vi.fn(),
  runBattleBuffPreparation: vi.fn(() => ({ kind: "noop" })),
  runBattleOffensiveDebuff: vi.fn(() => ({ kind: "noop" })),
  runBattleAttackAction: vi.fn(() => ({ kind: "noop" })),
  runBattleActionEffectDispatch: vi.fn(() => false),
  runBattleActionDecisionEvidence: vi.fn(),
}));

vi.mock("./decide-survival-action.js", () => ({
  BattleSurvivalActionEvent: { DECIDE: "decide" },
  runBattleSurvivalAction: mocks.runBattleSurvivalAction,
}));
vi.mock("./buff/decide-buff-preparation.js", () => ({
  BattleBuffPreparationEvent: { DECIDE: "decide" },
  runBattleBuffPreparation: mocks.runBattleBuffPreparation,
}));
vi.mock("./debuff/decide-offensive-debuff.js", () => ({
  BattleOffensiveDebuffEvent: { DECIDE: "decide" },
  runBattleOffensiveDebuff: mocks.runBattleOffensiveDebuff,
}));
vi.mock("./attack/decide-attack-action.js", () => ({
  BattleAttackActionEvent: { DECIDE: "decide" },
  runBattleAttackAction: mocks.runBattleAttackAction,
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
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runBattleSurvivalAction.mockImplementation(() => {
    throw new Error("survival exploded");
  });
  mocks.runBattleActionEffectDispatch.mockReturnValue(false);
  window.sessionStorage.clear();
});

describe("runBattleActionDecision decision step exceptions", () => {
  it("records thrown decision steps as structured not-acted results", () => {
    expect(
      runBattleActionDecision({
        type: BattleActionDecisionEvent.DECIDE,
        context: { snap: {}, actionOptions: {} },
      })
    ).toBe(false);

    expect(mocks.runBattleActionEffectDispatch.mock.calls[0][0].result).toMatchObject({
      kind: "decision-step-error",
      reason: "actionDecisionStepThrew",
      capability: "survival",
      error: "survival exploded",
    });
    expect(mocks.runBattleActionDecisionEvidence).toHaveBeenCalledWith({
      type: "recordTrace",
      steps: expect.arrayContaining([
        expect.objectContaining({
          capability: "survival",
          result: expect.objectContaining({
            kind: "decision-step-error",
            reason: "actionDecisionStepThrew",
            error: "survival exploded",
          }),
          acted: false,
        }),
      ]),
    });
  });
});
