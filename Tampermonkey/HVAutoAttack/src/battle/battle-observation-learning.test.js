import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleObservationLearningEvent,
  runBattleObservationLearning,
} from "./battle-observation-learning.js";

const mocks = vi.hoisted(() => ({
  runBigSkillKillLearningAutomation: vi.fn(),
  runCdLearningAutomation: vi.fn(),
  runIncomingBurstLearningAutomation: vi.fn(() => ({ learned: true })),
  runRecoveryLearningAutomation: vi.fn(),
}));

vi.mock("../state/recovery-learner.js", () => ({
  RecoveryLearningEvent: Object.freeze({ FINALIZE_PENDING: "finalizePending" }),
  runRecoveryLearningAutomation: mocks.runRecoveryLearningAutomation,
}));
vi.mock("../state/cd-learner.js", () => ({
  CdLearningEvent: Object.freeze({ FINALIZE_PENDING: "finalizePending" }),
  runCdLearningAutomation: mocks.runCdLearningAutomation,
}));
vi.mock("../state/big-skill-kill-learner.js", () => ({
  BigSkillKillLearningEvent: Object.freeze({ FINALIZE_PENDING: "finalizePending" }),
  runBigSkillKillLearningAutomation: mocks.runBigSkillKillLearningAutomation,
}));
vi.mock("../state/incoming-burst-learner.js", () => ({
  IncomingBurstLearningEvent: Object.freeze({
    READ_MAP: "readMap",
    RECORD_EVENTS: "recordEvents",
  }),
  runIncomingBurstLearningAutomation: mocks.runIncomingBurstLearningAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
});

describe("runBattleObservationLearning", () => {
  it("finalizes all pre-action observations through one entry", () => {
    const result = runBattleObservationLearning({
      type: BattleObservationLearningEvent.FINALIZE_TURN_OBSERVATIONS,
      battleLog: [{ text: "hit" }],
      globalTurn: 9,
      learnIncomingBurst: true,
      monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
      skillReady: { 111: true, 112: false },
      view: [
        { monsterId: 101, isDead: false },
        { monsterId: 202, isDead: true },
      ],
      vitals: { hpAbs: 500, mpAbs: 250, spAbs: 200 },
    });

    expect(mocks.runRecoveryLearningAutomation).toHaveBeenCalledWith({
      type: "finalizePending",
      recoveryAbs: { hp: 500, mp: 250, sp: 200 },
    });
    expect(mocks.runCdLearningAutomation).toHaveBeenCalledWith({
      type: "finalizePending",
      globalTurn: 9,
      readySkillIds: ["111"],
    });
    expect(mocks.runBigSkillKillLearningAutomation).toHaveBeenCalledWith({
      type: "finalizePending",
      globalTurn: 9,
      liveMonsterIds: [101],
    });
    expect(mocks.runIncomingBurstLearningAutomation).toHaveBeenCalledWith({
      type: "recordEvents",
      events: [{ text: "hit" }],
      monsterIdentities: [{ name: "Alpha", monsterId: 101 }],
    });
    expect(result).toEqual({ learnedBurstByMid: { learned: true } });
  });

  it("skips incoming burst recording when disabled", () => {
    const result = runBattleObservationLearning({
      type: BattleObservationLearningEvent.FINALIZE_TURN_OBSERVATIONS,
      learnIncomingBurst: false,
    });

    expect(mocks.runIncomingBurstLearningAutomation).not.toHaveBeenCalled();
    expect(result).toEqual({ learnedBurstByMid: {} });
  });

  it("ignores unknown observation learning events without touching downstream learners", () => {
    const result = runBattleObservationLearning({ type: "unknown" });

    expect(result).toEqual({ learnedBurstByMid: {} });
    expect(mocks.runRecoveryLearningAutomation).not.toHaveBeenCalled();
    expect(mocks.runCdLearningAutomation).not.toHaveBeenCalled();
    expect(mocks.runBigSkillKillLearningAutomation).not.toHaveBeenCalled();
    expect(mocks.runIncomingBurstLearningAutomation).not.toHaveBeenCalled();
  });
});
