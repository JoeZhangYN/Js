import { beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "./store.js";
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "./big-skill-kill-learner.js";
import {
  LearnedMonsterStoreEvent,
  runLearnedMonsterStoreAutomation,
} from "./learned-monster-store.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ INFO: "info", WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

const observedBoss = { mid: 100, hpMax: 5000, imperilActive: false };

beforeEach(() => {
  localStorage.clear();
  runLearnedMonsterStoreAutomation({ type: LearnedMonsterStoreEvent.RESET_RUNTIME });
  g("bigKillPending", null);
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runOptionAutomation.mockReset();
});

describe("big-skill kill learning diagnostics", () => {
  it("routes dynamic settle diagnostics through the typed console entry", async () => {
    mocks.runOptionAutomation.mockReturnValue(true);

    runBigSkillKillLearningAutomation({
      type: BigSkillKillLearningEvent.RECORD_CAST,
      code: "OFC",
      globalTurn: 0,
      observedBosses: [observedBoss],
    });
    const result = runBigSkillKillLearningAutomation({
      type: BigSkillKillLearningEvent.FINALIZE_PENDING,
      globalTurn: 1,
      liveMonsterIds: [],
    });

    expect(await result.completion).toBe(true);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "dynamicBigKillLog",
      fallback: false,
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "info",
      args: [
        "[HVAA] big-skill kill learning diagnostic",
        expect.objectContaining({ capability: "bigSkillKillLearning", stage: "settle" }),
      ],
    });
  });
});
