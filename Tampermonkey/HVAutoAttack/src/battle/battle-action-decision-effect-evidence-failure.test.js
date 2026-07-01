import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDecisionEvent, runBattleActionDecision } from "./battle-action-decision.js";

const mocks = vi.hoisted(() => ({
  readBattleActionEffectEvidence: vi.fn(),
  runBattleActionEffectDispatch: vi.fn(),
  runBattleActionDecisionEvidence: vi.fn(),
}));

vi.mock("./battle-action-effect-evidence.js", () => ({
  readBattleActionEffectEvidence: mocks.readBattleActionEffectEvidence,
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
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("battle action decision effect evidence read failures", () => {
  it("keeps acted decisions acted when effect evidence reads throw", () => {
    mocks.readBattleActionEffectEvidence.mockImplementation(() => {
      throw new Error("effect evidence read failed");
    });
    mocks.runBattleActionEffectDispatch.mockReturnValue(true);

    expect(
      runBattleActionDecision({
        type: BattleActionDecisionEvent.DECIDE,
        context: { snap: {}, actionOptions: { autoFlee: true } },
      })
    ).toBe(true);

    expect(mocks.runBattleActionDecisionEvidence).toHaveBeenCalledWith({
      type: "recordTrace",
      steps: [
        expect.objectContaining({
          capability: "survival",
          acted: true,
          effectEvidenceReadError: "effect evidence read failed",
        }),
      ],
    });
  });
});
