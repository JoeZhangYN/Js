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

describe("battle target command skill failures", () => {
  it("records click-skill target skill command exceptions without clicking target", () => {
    const target = liveTarget();
    mocks.gE.mockReturnValue(target);
    mocks.runBattleSkillCommand.mockImplementation(() => {
      throw new Error("skill bridge failed");
    });

    expect(
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.CLICK_SKILL_THEN_TARGET,
        skillId: "213",
        targetId: 3,
      })
    ).toBe(false);

    expect(target.click).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.clickSkillThenTarget",
      result: "rejected",
      reason: "skillCommandThrew",
      detail: { skillId: "213", targetId: 3, error: "skill bridge failed" },
    });
  });

  it("records try-skill target skill command exceptions without fallback target click", () => {
    const target = liveTarget();
    mocks.gE.mockReturnValue(target);
    mocks.runBattleSkillCommand.mockImplementation(() => {
      throw new Error("skill bridge failed");
    });

    expect(
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
        skillId: "1111",
        targetId: 3,
      })
    ).toBe(false);

    expect(target.click).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.trySkillThenTarget",
      result: "rejected",
      reason: "skillCommandThrew",
      detail: { skillId: "1111", targetId: 3, error: "skill bridge failed" },
    });
  });
});
