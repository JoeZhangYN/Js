import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeAttack } from "./execute-attack.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  runBattleFocusCommand: vi.fn(),
  runBattleTargetCommand: vi.fn(),
  runPhysicalSkillBookkeeping: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
}));

vi.mock("../../state/store.js", () => ({ g: mocks.g }));
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

describe("executeAttack", () => {
  it("routes Focus through the Focus command entry and still claims the attack branch", () => {
    mocks.runBattleFocusCommand.mockReturnValue(false);

    expect(executeAttack({ type: "focus" }, {})).toBe(true);

    expect(mocks.runBattleFocusCommand).toHaveBeenCalledWith({ type: "click" });
  });

  it("reports Spirit toggle cooldown through the Spirit toggle entry", () => {
    mocks.runBattleSpiritToggleAutomation.mockReturnValue(true);

    expect(executeAttack({ type: "toggle-spirit" }, {})).toBe(true);

    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({
      type: "clickAndRecord",
    });
  });

  it("reports physical skill fire through the bookkeeping entry", () => {
    mocks.runBattleTargetCommand.mockImplementation((event) => {
      event.afterSkillClick?.();
      return true;
    });

    expect(
      executeAttack(
        {
          type: "physical",
          skillId: "1111",
          code: "OFC",
          defaultTargetId: 3,
        },
        { globalTurn: 10 }
      )
    ).toBe(true);

    expect(mocks.runBattleTargetCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "trySkillThenTarget",
        skillId: "1111",
        targetId: 3,
      })
    );
    expect(mocks.runPhysicalSkillBookkeeping).toHaveBeenCalledWith({
      type: "recordFire",
      code: "OFC",
      skillId: "1111",
      snap: { globalTurn: 10 },
    });
  });

  it("requires physical skill fire before the merciful target and still clicks the default target", () => {
    executeAttack(
      {
        type: "physical",
        skillId: "1111",
        code: "OFC",
        mercifulTargetId: 2,
        defaultTargetId: 3,
      },
      { globalTurn: 11 }
    );

    expect(mocks.runBattleTargetCommand).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "trySkillThenTarget",
        skillId: "1111",
        targetId: 2,
        targetRequiresSkill: true,
      })
    );
    expect(mocks.runBattleTargetCommand).toHaveBeenNthCalledWith(2, {
      type: "clickTarget",
      targetId: 3,
    });
  });
});
