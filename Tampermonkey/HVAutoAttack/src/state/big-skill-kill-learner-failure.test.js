import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  setValue: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ INFO: "info", WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue };
});

vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "./big-skill-kill-learner.js";
import { BIG_SKILL_KILL_LEARNING_FAILURE_KEY } from "./big-skill-kill-learner-failure.js";
import { g } from "./store.js";

const pending = {
  globalTurn: 7,
  skill: "OFC",
  bosses: [{ mid: 100, hpMax: 5000, imperilActive: false }],
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
  g("bigKillPending", null);
});

function settleWithFailingStorage() {
  g("bigKillPending", pending);
  return runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.FINALIZE_PENDING,
    globalTurn: 8,
    liveMonsterIds: [],
  });
}

describe("big-skill kill learning persistence failures", () => {
  it("does not report learned big-kill success when storage write fails", () => {
    mocks.setValue.mockImplementation(() => {
      throw new Error("big-kill learning write blocked");
    });

    expect(settleWithFailingStorage()).toBe(false);

    expect(
      JSON.parse(window.sessionStorage.getItem(BIG_SKILL_KILL_LEARNING_FAILURE_KEY))
    ).toMatchObject({
      capability: "bigSkillKillLearning",
      stage: "update-learned",
      failure: { kind: "storageWrite", error: "big-kill learning write blocked" },
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] big-skill kill learning persistence failed",
        expect.objectContaining({ capability: "bigSkillKillLearning", stage: "update-learned" }),
      ],
    });
    expect(g("bigKillPending")).toEqual(pending);
  });

  it("does not throw when big-kill learning failure evidence and diagnostic console both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === BIG_SKILL_KILL_LEARNING_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    mocks.setValue.mockImplementation(() => {
      throw new Error("big-kill learning write blocked");
    });

    expect(() => settleWithFailingStorage()).not.toThrow();
    expect(settleWithFailingStorage()).toBe(false);
  });
});
