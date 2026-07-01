import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleAttackExecutionEvent, runBattleAttackExecution } from "./execute-attack.js";

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

function applyPlan(plan, snap) {
  return runBattleAttackExecution({
    type: BattleAttackExecutionEvent.APPLY_PLAN,
    plan,
    snap,
  });
}

describe("runBattleAttackExecution", () => {
  it("returns the Focus command result instead of claiming a missing click acted", () => {
    mocks.runBattleFocusCommand.mockReturnValue(false);

    expect(applyPlan({ type: "focus" }, {})).toBe(false);

    expect(mocks.runBattleFocusCommand).toHaveBeenCalledWith({ type: "click" });
    mocks.runBattleFocusCommand.mockReturnValue(true);
    expect(applyPlan({ type: "focus" }, {})).toBe(true);
  });

  it("reports Spirit toggle cooldown through the Spirit toggle entry", () => {
    mocks.runBattleSpiritToggleAutomation.mockReturnValue(true);

    expect(applyPlan({ type: "toggle-spirit" }, {})).toBe(true);

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
      applyPlan(
        {
          type: "physical",
          skillId: "1111",
          code: "OFC",
          defaultTargetId: 3,
        },
        {
          globalTurn: 10,
          view: [
            { monsterId: 100, isBoss: true, isDead: false, hpMax: 5000, buffs: ["imperil"] },
            { monsterId: 200, isBoss: true, isDead: true, hpMax: 6000, buffs: [] },
          ],
        }
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
      globalTurn: 10,
      observedBosses: [{ mid: 100, hpMax: 5000, imperilActive: true }],
    });
  });

  it("does not claim spell, physical, or default attack plans when target commands do not act", () => {
    mocks.runBattleTargetCommand.mockReturnValue(false);

    expect(applyPlan({ type: "spell", spellId: "123", targetId: 3 }, {})).toBe(false);
    expect(applyPlan({ type: "merciful-single", skillId: "2203", targetId: 3 }, {})).toBe(false);
    expect(
      applyPlan({ type: "physical", skillId: "1111", code: "OFC", defaultTargetId: 3 }, {})
    ).toBe(false);
    expect(applyPlan({ type: "default", targetId: 3 }, {})).toBe(false);
  });

  it("requires physical skill fire before the merciful target and still clicks the default target", () => {
    mocks.runBattleTargetCommand.mockReturnValue(true);

    applyPlan(
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

  it("rejects unknown attack execution events", () => {
    expect(runBattleAttackExecution({ type: "unknown" })).toBe(false);

    expect(mocks.runBattleFocusCommand).not.toHaveBeenCalled();
    expect(mocks.runBattleTargetCommand).not.toHaveBeenCalled();
    expect(mocks.runPhysicalSkillBookkeeping).not.toHaveBeenCalled();
    expect(mocks.runBattleSpiritToggleAutomation).not.toHaveBeenCalled();
  });
});
