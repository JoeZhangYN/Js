import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleAttackExecutionEvent, runBattleAttackExecution } from "./execute-attack.js";

const mocks = vi.hoisted(() => ({
  runBattleFocusCommand: vi.fn(),
  runBattleTargetCommand: vi.fn(),
  runPhysicalSkillBookkeeping: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runBattleActionEffectEvidence: vi.fn(),
}));

vi.mock("../battle-focus-command.js", () => ({
  BattleFocusCommandEvent: Object.freeze({ CLICK: "click" }),
  runBattleFocusCommand: mocks.runBattleFocusCommand,
}));
vi.mock("../battle-target-command.js", () => ({
  BattleTargetCommandEvent: Object.freeze({
    CLICK_TARGET: "clickTarget",
    TRY_SKILL_THEN_TARGET: "trySkillThenTarget",
  }),
  runBattleTargetCommand: mocks.runBattleTargetCommand,
}));
vi.mock("./physical-skill-bookkeeping.js", () => ({
  PhysicalSkillBookkeepingEvent: Object.freeze({ RECORD_FIRE: "recordFire" }),
  runPhysicalSkillBookkeeping: mocks.runPhysicalSkillBookkeeping,
}));
vi.mock("../battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ CLICK_AND_RECORD: "clickAndRecord" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));
vi.mock("../battle-action-effect-evidence.js", () => ({
  BattleActionEffectEvidenceEvent: Object.freeze({ RECORD_APPLIED: "recordApplied" }),
  runBattleActionEffectEvidence: mocks.runBattleActionEffectEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runBattleAttackExecution merciful physical side effects", () => {
  it("does not click the default target when the merciful skill-target command fails", () => {
    mocks.runBattleTargetCommand.mockReturnValue(false);

    expect(
      runBattleAttackExecution({
        type: BattleAttackExecutionEvent.APPLY_PLAN,
        plan: {
          type: "physical",
          skillId: "1111",
          code: "OFC",
          mercifulTargetId: 2,
          defaultTargetId: 3,
        },
        snap: { globalTurn: 11 },
      })
    ).toBe(false);

    expect(mocks.runBattleTargetCommand).toHaveBeenCalledTimes(1);
    expect(mocks.runBattleTargetCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "trySkillThenTarget",
        skillId: "1111",
        targetId: 2,
        targetRequiresSkill: true,
      })
    );
  });

  it("keeps acted merciful physical plans acted when the fallback target command throws", () => {
    mocks.runBattleTargetCommand
      .mockReturnValueOnce(true)
      .mockImplementationOnce(() => {
        throw new Error("default target bridge failed");
      });

    expect(
      runBattleAttackExecution({
        type: BattleAttackExecutionEvent.APPLY_PLAN,
        plan: {
          type: "physical",
          skillId: "1111",
          code: "OFC",
          mercifulTargetId: 2,
          defaultTargetId: 3,
        },
        snap: { globalTurn: 11 },
      })
    ).toBe(true);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith({
      type: "recordApplied",
      result: {
        kind: "attack-execution-event",
        reason: "mercifulFallbackTargetThrew",
        planType: "physical",
        defaultTargetId: 3,
        mercifulTargetId: 2,
      },
      acted: true,
      knownResultKind: true,
      failureReason: "mercifulFallbackTargetThrew",
      executionError: "default target bridge failed",
    });
  });

  it("keeps acted merciful physical plans acted when the fallback target command rejects", () => {
    mocks.runBattleTargetCommand.mockReturnValueOnce(true).mockReturnValueOnce(false);

    expect(
      runBattleAttackExecution({
        type: BattleAttackExecutionEvent.APPLY_PLAN,
        plan: {
          type: "physical",
          skillId: "1111",
          code: "OFC",
          mercifulTargetId: 2,
          defaultTargetId: 3,
        },
        snap: { globalTurn: 11 },
      })
    ).toBe(true);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        acted: true,
        failureReason: "mercifulFallbackTargetRejected",
      })
    );
  });

  it("keeps acted merciful physical plans acted when fallback target returns typed failure", () => {
    mocks.runBattleTargetCommand.mockReturnValueOnce(true).mockReturnValueOnce({
      kind: "failed",
      reason: "targetReadFailed",
    });

    expect(
      runBattleAttackExecution({
        type: BattleAttackExecutionEvent.APPLY_PLAN,
        plan: {
          type: "physical",
          skillId: "1111",
          code: "OFC",
          mercifulTargetId: 2,
          defaultTargetId: 3,
        },
        snap: { globalTurn: 11 },
      })
    ).toBe(true);

    expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        acted: true,
        failureReason: "mercifulFallbackTargetRejected",
      })
    );
  });
});
