import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  isOn: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isOn: mocks.isOn }));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runBattleSkillCommand", () => {
  it("clicks a ready skill and runs the hook after the click", () => {
    const calls = [];
    const skill = { click: vi.fn(() => calls.push("click")) };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockReturnValue(skill);

    expect(
      runBattleSkillCommand({
        type: BattleSkillCommandEvent.CLICK_READY,
        skillId: "412",
        afterClick: () => calls.push("hook"),
      })
    ).toBe(true);

    expect(mocks.isOn).toHaveBeenCalledWith("412");
    expect(mocks.gE).toHaveBeenCalledWith("412");
    expect(calls).toEqual(["click", "hook"]);
  });

  it("does not click or run the hook when the skill is unavailable", () => {
    const afterClick = vi.fn();
    mocks.isOn.mockReturnValue(false);

    expect(
      runBattleSkillCommand({
        type: BattleSkillCommandEvent.CLICK_READY,
        skillId: "412",
        afterClick,
      })
    ).toBe(false);

    expect(mocks.gE).not.toHaveBeenCalled();
    expect(afterClick).not.toHaveBeenCalled();
  });
});
