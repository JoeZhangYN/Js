import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeAttack } from "./execute-attack.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isOn: vi.fn(),
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
});
