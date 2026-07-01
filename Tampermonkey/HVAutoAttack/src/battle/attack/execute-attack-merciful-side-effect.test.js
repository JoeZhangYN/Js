import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleAttackExecutionEvent, runBattleAttackExecution } from "./execute-attack.js";

const mocks = vi.hoisted(() => ({
  runBattleFocusCommand: vi.fn(),
  runBattleTargetCommand: vi.fn(),
  runPhysicalSkillBookkeeping: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
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
});
