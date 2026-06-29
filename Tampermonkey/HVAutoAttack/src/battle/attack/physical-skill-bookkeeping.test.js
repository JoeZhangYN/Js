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

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runPhysicalSkillBookkeeping", () => {
  it("records one physical skill fire through all bookkeeping entries", () => {
    const snap = {
      globalTurn: 10,
      view: [
        { monsterId: 100, isBoss: true, isDead: false, hpMax: 5000, buffs: ["imperil"] },
        { monsterId: 200, isBoss: true, isDead: true, hpMax: 6000, buffs: [] },
        { monsterId: 300, isBoss: false, isDead: false, hpMax: 7000, buffs: [] },
      ],
    };

    runPhysicalSkillBookkeeping({
      type: PhysicalSkillBookkeepingEvent.RECORD_FIRE,
      code: "OFC",
      skillId: "1111",
      globalTurn: 10,
      snap,
    });

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
  });
});
