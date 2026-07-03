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

function liveTarget() {
  return { click: vi.fn(), querySelector: vi.fn(() => null) };
}

describe("runBattleTargetCommand typed skill failures", () => {
  it("does not click target when required skill command returns typed failure", () => {
    const target = liveTarget();
    mocks.runBattleSkillCommand.mockReturnValue({
      kind: "failed",
      reason: "skillElementReadFailed",
    });
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

  it("records typed failed optional skill commands without claiming the skill clicked", () => {
    const target = liveTarget();
    mocks.runBattleSkillCommand.mockReturnValue({
      kind: "failed",
      reason: "skillElementReadFailed",
    });
    mocks.gE.mockImplementation((selector) => (selector === "#mkey_3" ? target : null));

    expect(
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
        skillId: "1111",
        targetId: 3,
      })
    ).toBe(true);

    expect(target.click).toHaveBeenCalledOnce();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.trySkillThenTarget",
      result: "accepted",
      reason: "clicked",
      detail: { skillId: "1111", targetId: 3, clickedSkill: false },
    });
  });
});
