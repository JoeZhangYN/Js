import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  isOn: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isOn: mocks.isOn }));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  sessionStorage.clear();
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
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "skill.clickReady",
      result: "accepted",
      reason: "clicked",
      detail: { skillId: "412" },
    });
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
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "skill.clickReady",
      result: "rejected",
      reason: "skillNotReady",
      detail: { skillId: "412" },
    });
  });

  it("records skill click failures as not acted", () => {
    const afterClick = vi.fn();
    const skill = {
      click: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockReturnValue(skill);

    expect(
      runBattleSkillCommand({
        type: BattleSkillCommandEvent.CLICK_READY,
        skillId: "412",
        afterClick,
      })
    ).toBe(false);

    expect(afterClick).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "skill.clickReady",
      result: "rejected",
      reason: "clickFailed",
      detail: { skillId: "412", error: "blocked" },
    });
  });

  it("keeps clicked skills acted when the after-click hook fails", () => {
    const skill = { click: vi.fn() };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockReturnValue(skill);

    expect(
      runBattleSkillCommand({
        type: BattleSkillCommandEvent.CLICK_READY,
        skillId: "412",
        afterClick: () => {
          throw new Error("hook failed");
        },
      })
    ).toBe(true);

    expect(skill.click).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "skill.clickReady",
      result: "accepted",
      reason: "clicked",
      acted: true,
      failureReason: null,
      detail: { skillId: "412", afterClickError: "hook failed" },
    });
  });

  it("records unknown skill command rejections", () => {
    expect(runBattleSkillCommand({ type: "unknown" })).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "skill.clickReady",
      result: "rejected",
      reason: "unknownSkillCommand",
      detail: { eventType: "unknown" },
    });
  });

  it("records missing skill command events as not acted", () => {
    expect(runBattleSkillCommand()).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "skill.clickReady",
      result: "rejected",
      reason: "unknownSkillCommand",
      detail: { eventType: null },
    });
  });
});
