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

describe("battle target command live target read failures", () => {
  it("records target selector read failures as not acted", () => {
    mocks.gE.mockImplementation(() => {
      throw new Error("target read exploded");
    });

    expect(
      runBattleTargetCommand({ type: BattleTargetCommandEvent.CLICK_TARGET, targetId: 3 })
    ).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.click",
      result: "rejected",
      reason: "targetReadFailed",
      detail: { targetId: 3, error: "target read exploded" },
    });
  });

  it("records target dead-state read failures without clicking skill or target", () => {
    const target = {
      click: vi.fn(),
      querySelector: vi.fn(() => {
        throw new Error("target state exploded");
      }),
    };
    mocks.gE.mockReturnValue(target);

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
      reason: "targetStateReadFailed",
      detail: { skillId: "213", targetId: 3, error: "target state exploded" },
    });
  });
});
