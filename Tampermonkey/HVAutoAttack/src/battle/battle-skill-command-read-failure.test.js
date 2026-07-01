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

describe("runBattleSkillCommand DOM read failures", () => {
  it("records skill readiness read failures as not acted", () => {
    const afterClick = vi.fn();
    mocks.isOn.mockImplementation(() => {
      throw new Error("readiness exploded");
    });

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
      reason: "skillReadinessReadFailed",
      detail: { skillId: "412", error: "readiness exploded" },
    });
  });

  it("records skill element read failures as not acted", () => {
    const afterClick = vi.fn();
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockImplementation(() => {
      throw new Error("element read exploded");
    });

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
      reason: "skillElementReadFailed",
      detail: { skillId: "412", error: "element read exploded" },
    });
  });
});
