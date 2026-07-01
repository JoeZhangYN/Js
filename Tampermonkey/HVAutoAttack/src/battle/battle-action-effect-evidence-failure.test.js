import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";

const mocks = vi.hoisted(() => ({
  runBattleActionEffectEvidence: vi.fn(),
  runBattleSkillCommand: vi.fn(),
}));

vi.mock("./battle-action-effect-evidence.js", () => ({
  BattleActionEffectEvidenceEvent: { RECORD_APPLIED: "recordApplied" },
  runBattleActionEffectEvidence: mocks.runBattleActionEffectEvidence,
}));

vi.mock("./battle-skill-command.js", () => ({
  BattleSkillCommandEvent: { CLICK_READY: "clickReady" },
  runBattleSkillCommand: mocks.runBattleSkillCommand,
}));

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.runBattleActionEffectEvidence.mockReset();
  mocks.runBattleSkillCommand.mockReset();
});

describe("battle action effect evidence failures", () => {
  it("keeps acted effects acted when effect evidence recording fails once", () => {
    mocks.runBattleSkillCommand.mockReturnValue(true);
    mocks.runBattleActionEffectEvidence
      .mockImplementationOnce(() => {
        throw new Error("effect evidence failed");
      })
      .mockReturnValue(true);

    expect(
      runBattleActionEffectDispatch({
        type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
        result: { kind: "skill-command", skillId: 111 },
      })
    ).toBe(true);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenLastCalledWith({
      type: "recordApplied",
      result: {
        kind: "effect-evidence-event",
        reason: "actionEffectEvidenceWriteFailed",
        originalResultKind: "skill-command",
        error: "effect evidence failed",
      },
      acted: false,
      knownResultKind: false,
      failureReason: "actionEffectEvidenceWriteFailed",
    });
  });

  it("does not throw when effect evidence recording keeps failing", () => {
    mocks.runBattleSkillCommand.mockReturnValue(true);
    mocks.runBattleActionEffectEvidence.mockImplementation(() => {
      throw new Error("effect evidence failed");
    });

    expect(() =>
      runBattleActionEffectDispatch({
        type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
        result: { kind: "skill-command", skillId: 111 },
      })
    ).not.toThrow();
  });
});
