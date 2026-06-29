import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleTargetCommandEvent, runBattleTargetCommand } from "./battle-target-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  isOn: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isOn: mocks.isOn }));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runBattleTargetCommand", () => {
  it("clicks a target by battle slot id", () => {
    const target = { click: vi.fn() };
    mocks.gE.mockReturnValue(target);

    expect(
      runBattleTargetCommand({ type: BattleTargetCommandEvent.CLICK_TARGET, targetId: 3 })
    ).toBe(true);

    expect(mocks.gE).toHaveBeenCalledWith("#mkey_3");
    expect(target.click).toHaveBeenCalledTimes(1);
  });

  it("clicks ready skill then live target", () => {
    const skill = { click: vi.fn() };
    const target = { click: vi.fn(), querySelector: vi.fn(() => null) };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockImplementation((selector) => {
      if (selector === "213") return skill;
      if (selector === "#mkey_3") return target;
      return null;
    });

    expect(
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.CLICK_SKILL_THEN_TARGET,
        skillId: "213",
        targetId: 3,
      })
    ).toBe(true);

    expect(skill.click).toHaveBeenCalledTimes(1);
    expect(target.click).toHaveBeenCalledTimes(1);
  });

  it("does not click skill when the target is dead", () => {
    const skill = { click: vi.fn() };
    const target = { click: vi.fn(), querySelector: vi.fn(() => ({})) };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockImplementation((selector) => {
      if (selector === "213") return skill;
      if (selector === "#mkey_3") return target;
      return null;
    });

    expect(
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.CLICK_SKILL_THEN_TARGET,
        skillId: "213",
        targetId: 3,
      })
    ).toBe(false);

    expect(skill.click).not.toHaveBeenCalled();
    expect(target.click).not.toHaveBeenCalled();
  });

  it("tries skill if ready, runs hook, then clicks target", () => {
    const calls = [];
    const skill = { click: vi.fn(() => calls.push("skill")) };
    const target = { click: vi.fn(() => calls.push("target")) };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockImplementation((selector) => {
      if (selector === "1111") return skill;
      if (selector === "#mkey_3") return target;
      return null;
    });

    expect(
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
        skillId: "1111",
        targetId: 3,
        afterSkillClick: () => calls.push("hook"),
      })
    ).toBe(true);

    expect(calls).toEqual(["skill", "hook", "target"]);
  });

  it("can require skill readiness before clicking the target", () => {
    const target = { click: vi.fn() };
    mocks.isOn.mockReturnValue(false);
    mocks.gE.mockImplementation((selector) => (selector === "#mkey_3" ? target : null));

    expect(
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
        skillId: "1111",
        targetId: 3,
        targetRequiresSkill: true,
      })
    ).toBe(false);

    expect(target.click).not.toHaveBeenCalled();
  });
});
