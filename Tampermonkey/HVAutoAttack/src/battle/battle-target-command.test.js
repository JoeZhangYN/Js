import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleTargetCommandEvent, runBattleTargetCommand } from "./battle-target-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  runBattleSkillCommand: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("./battle-skill-command.js", () => ({
  BattleSkillCommandEvent: Object.freeze({ CLICK_READY: "clickReady" }),
  runBattleSkillCommand: mocks.runBattleSkillCommand,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  sessionStorage.clear();
});

describe("runBattleTargetCommand", () => {
  it("clicks a target by battle slot id", () => {
    const target = { click: vi.fn(), querySelector: vi.fn(() => null) };
    mocks.gE.mockReturnValue(target);

    expect(
      runBattleTargetCommand({ type: BattleTargetCommandEvent.CLICK_TARGET, targetId: 3 })
    ).toBe(true);

    expect(mocks.gE).toHaveBeenCalledWith("#mkey_3");
    expect(target.click).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.click",
      result: "accepted",
      reason: "clicked",
      detail: { targetId: 3 },
    });
  });

  it("clicks ready skill then live target", () => {
    const target = { click: vi.fn(), querySelector: vi.fn(() => null) };
    mocks.runBattleSkillCommand.mockReturnValue(true);
    mocks.gE.mockImplementation((selector) => {
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

    expect(mocks.runBattleSkillCommand).toHaveBeenCalledWith({
      type: "clickReady",
      skillId: "213",
    });
    expect(target.click).toHaveBeenCalledTimes(1);
  });

  it("does not click skill when the target is dead", () => {
    const target = { click: vi.fn(), querySelector: vi.fn(() => ({})) };
    mocks.gE.mockImplementation((selector) => {
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

    expect(mocks.runBattleSkillCommand).not.toHaveBeenCalled();
    expect(target.click).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.clickSkillThenTarget",
      result: "rejected",
      reason: "targetDead",
      detail: { skillId: "213", targetId: 3 },
    });
  });

  it("tries skill if ready, runs hook, then clicks target", () => {
    const calls = [];
    const target = { click: vi.fn(() => calls.push("target")), querySelector: vi.fn(() => null) };
    mocks.runBattleSkillCommand.mockImplementation((event) => {
      calls.push("skill");
      event.afterClick();
      return true;
    });
    mocks.gE.mockImplementation((selector) => {
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
    const target = { click: vi.fn(), querySelector: vi.fn(() => null) };
    mocks.runBattleSkillCommand.mockReturnValue(false);
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
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.trySkillThenTarget",
      result: "rejected",
      reason: "skillRequired",
      detail: { skillId: "1111", targetId: 3 },
    });
  });

  it("returns not acted when try skill then target cannot click the target", () => {
    mocks.runBattleSkillCommand.mockReturnValue(false);
    mocks.gE.mockReturnValue(null);

    expect(
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
        skillId: "1111",
        targetId: 3,
      })
    ).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.trySkillThenTarget",
      result: "rejected",
      reason: "targetCommandRejected",
      detail: { skillId: "1111", targetId: 3, clickedSkill: false },
    });
  });

  it("records unknown target command rejections", () => {
    expect(runBattleTargetCommand({ type: "unknown" })).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.unknown",
      result: "rejected",
      reason: "unknownTargetCommand",
      detail: { eventType: "unknown" },
    });
  });

  it("records missing target command events as not acted", () => {
    expect(runBattleTargetCommand()).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.unknown",
      result: "rejected",
      reason: "unknownTargetCommand",
    });
  });
});
