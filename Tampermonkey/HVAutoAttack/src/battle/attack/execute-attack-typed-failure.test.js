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

function applyPlan(plan, snap = {}) {
  return runBattleAttackExecution({
    type: BattleAttackExecutionEvent.APPLY_PLAN,
    plan,
    snap,
  });
}

describe("runBattleAttackExecution typed command failures", () => {
  it("does not claim typed failed attack commands as acted", () => {
    mocks.runBattleFocusCommand.mockReturnValue({
      kind: "failed",
      reason: "focusElementReadFailed",
    });

    expect(applyPlan({ type: "focus" })).toBe(false);
  });

  it("does not click the merciful fallback target after a typed failed skill-target command", () => {
    mocks.runBattleTargetCommand.mockReturnValue({
      kind: "failed",
      reason: "targetCommandRejected",
    });

    expect(
      applyPlan({
        type: "physical",
        skillId: "1111",
        code: "OFC",
        mercifulTargetId: 2,
        defaultTargetId: 3,
      })
    ).toBe(false);

    expect(mocks.runBattleTargetCommand).toHaveBeenCalledTimes(1);
  });
});
