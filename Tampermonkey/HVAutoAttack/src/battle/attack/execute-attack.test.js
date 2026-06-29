import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeAttack } from "./execute-attack.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isOn: vi.fn(),
  runBattleSkillUsageAutomation: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runBigSkillKillLearningAutomation: vi.fn(),
  runCdLearningAutomation: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
}));

vi.mock("../../dom/query.js", () => ({
  gE: mocks.gE,
  isOn: mocks.isOn,
}));
vi.mock("../../state/store.js", () => ({ g: mocks.g }));
vi.mock("../../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ RECORD_FIRE: "recordFire" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("../../state/cd-learner.js", () => ({
  CdLearningEvent: Object.freeze({ RECORD_FIRE: "recordFire" }),
  runCdLearningAutomation: mocks.runCdLearningAutomation,
}));
vi.mock("../../state/big-skill-kill-learner.js", () => ({
  BigSkillKillLearningEvent: Object.freeze({ RECORD_CAST: "recordCast" }),
  runBigSkillKillLearningAutomation: mocks.runBigSkillKillLearningAutomation,
}));
vi.mock("../battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ RECORD_TOGGLE: "recordToggle" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));
vi.mock("../battle-skill-usage.js", () => ({
  BattleSkillUsageEvent: Object.freeze({ RECORD_USE: "recordUse" }),
  runBattleSkillUsageAutomation: mocks.runBattleSkillUsageAutomation,
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

  it("reports physical skill usage through the battle skill usage entry", () => {
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

    expect(mocks.runBattleSkillUsageAutomation).toHaveBeenCalledWith({
      type: "recordUse",
      code: "OFC",
    });
    expect(skill.click).toHaveBeenCalledTimes(1);
    expect(target.click).toHaveBeenCalledTimes(1);
  });
});
