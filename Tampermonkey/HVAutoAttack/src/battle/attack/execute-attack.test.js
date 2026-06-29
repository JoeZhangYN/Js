import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeAttack } from "./execute-attack.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isOn: vi.fn(),
  runPhysicalSkillBookkeeping: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
}));

vi.mock("../../dom/query.js", () => ({
  gE: mocks.gE,
  isOn: mocks.isOn,
}));
vi.mock("../../state/store.js", () => ({ g: mocks.g }));
vi.mock("./physical-skill-bookkeeping.js", () => ({
  PhysicalSkillBookkeepingEvent: Object.freeze({ RECORD_FIRE: "recordFire" }),
  runPhysicalSkillBookkeeping: mocks.runPhysicalSkillBookkeeping,
}));
vi.mock("../battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ RECORD_TOGGLE: "recordToggle" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("executeAttack", () => {
  it("reports Spirit toggle cooldown through the Spirit toggle entry", () => {
    const spirit = { click: vi.fn() };
    mocks.gE.mockReturnValue(spirit);

    expect(executeAttack({ type: "toggle-spirit" }, {})).toBe(true);

    expect(spirit.click).toHaveBeenCalledTimes(1);
    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({
      type: "recordToggle",
    });
  });

  it("reports physical skill fire through the bookkeeping entry", () => {
    const skill = { click: vi.fn() };
    const target = { click: vi.fn() };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockImplementation((selector) => {
      if (selector === "1111") return skill;
      if (selector === "#mkey_3") return target;
      return null;
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

    expect(mocks.runPhysicalSkillBookkeeping).toHaveBeenCalledWith({
      type: "recordFire",
      code: "OFC",
      skillId: "1111",
      snap: { globalTurn: 10 },
    });
    expect(skill.click).toHaveBeenCalledTimes(1);
    expect(target.click).toHaveBeenCalledTimes(1);
  });
});
