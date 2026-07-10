import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PhysicalSkillBookkeepingEvent,
  runPhysicalSkillBookkeeping,
} from "./physical-skill-bookkeeping.js";

const mocks = vi.hoisted(() => ({
  runBattleSkillUsageAutomation: vi.fn(),
  runBigSkillKillLearningAutomation: vi.fn(),
  runCdLearningAutomation: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runUtilityWeightLearning: vi.fn(),
}));

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
vi.mock("../battle-skill-usage.js", () => ({
  BattleSkillUsageEvent: Object.freeze({ RECORD_USE: "recordUse" }),
  runBattleSkillUsageAutomation: mocks.runBattleSkillUsageAutomation,
}));
vi.mock("../../state/utility-weight-learner.js", () => ({
  UtilityWeightLearningEvent: Object.freeze({ RECORD_PHYSICAL_CAST: "recordPhysicalCast" }),
  runUtilityWeightLearning: mocks.runUtilityWeightLearning,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runPhysicalSkillBookkeeping", () => {
  it("records one physical skill fire through all bookkeeping entries", () => {
    const recorded = runPhysicalSkillBookkeeping({
      type: PhysicalSkillBookkeepingEvent.RECORD_FIRE,
      code: "OFC",
      skillId: "1111",
      globalTurn: 10,
      ocCost: 205,
      view: [{ id: 1, hpAbsNow: 5000, hpMax: 5000, isDead: false }],
      observedBosses: [{ mid: 100, hpMax: 5000, imperilActive: true }],
    });

    expect(recorded).toBe(true);
    expect(mocks.runBattleSkillUsageAutomation).toHaveBeenCalledWith({
      type: "recordUse",
      code: "OFC",
    });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({
      type: "recordFire",
      code: "OFC",
    });
    expect(mocks.runCdLearningAutomation).toHaveBeenCalledWith({
      type: "recordFire",
      code: "OFC",
      id: "1111",
      globalTurn: 10,
    });
    expect(mocks.runBigSkillKillLearningAutomation).toHaveBeenCalledWith({
      type: "recordCast",
      code: "OFC",
      globalTurn: 10,
      observedBosses: [{ mid: 100, hpMax: 5000, imperilActive: true }],
    });
    expect(mocks.runUtilityWeightLearning).toHaveBeenCalledWith({
      type: "recordPhysicalCast",
      code: "OFC",
      ocCost: 205,
      globalTurn: 10,
      view: [{ id: 1, hpAbsNow: 5000, hpMax: 5000, isDead: false }],
    });
  });

  it("rejects unknown physical skill bookkeeping events without side effects", () => {
    expect(runPhysicalSkillBookkeeping({ type: "unknown", code: "OFC" })).toBe(false);
    expect(runPhysicalSkillBookkeeping(null)).toBe(false);
    for (const fn of Object.values(mocks)) expect(fn).not.toHaveBeenCalled();
  });
});
