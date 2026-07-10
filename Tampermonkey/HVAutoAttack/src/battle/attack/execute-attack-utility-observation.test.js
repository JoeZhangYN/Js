import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runBattleTargetCommand: vi.fn(),
  runPhysicalSkillBookkeeping: vi.fn(),
}));

vi.mock("../battle-target-command.js", () => ({
  BattleTargetCommandEvent: Object.freeze({ TRY_SKILL_THEN_TARGET: "trySkillThenTarget" }),
  runBattleTargetCommand: mocks.runBattleTargetCommand,
}));
vi.mock("./physical-skill-bookkeeping.js", () => ({
  PhysicalSkillBookkeepingEvent: Object.freeze({ RECORD_FIRE: "recordFire" }),
  runPhysicalSkillBookkeeping: mocks.runPhysicalSkillBookkeeping,
}));

import { BattleAttackExecutionEvent, runBattleAttackExecution } from "./execute-attack.js";

describe("physical skill utility observation command", () => {
  it("hands OC cost and the authoritative pre-action view to bookkeeping", () => {
    const view = [{ id: 1, hpAbsNow: 100, hpMax: 100, isDead: false }];
    mocks.runBattleTargetCommand.mockImplementation((event) => {
      event.afterSkillClick();
      return true;
    });

    runBattleAttackExecution({
      type: BattleAttackExecutionEvent.APPLY_PLAN,
      plan: {
        type: "physical",
        code: "T1",
        skillId: "2201",
        ocCost: 30,
        defaultTargetId: 1,
      },
      snap: { globalTurn: 10, view },
    });

    expect(mocks.runPhysicalSkillBookkeeping).toHaveBeenCalledWith(
      expect.objectContaining({ code: "T1", ocCost: 30, globalTurn: 10, view })
    );
  });
});
