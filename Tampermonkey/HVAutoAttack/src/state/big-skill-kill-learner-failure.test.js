import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ runDiagnosticConsoleAutomation: vi.fn() }));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ INFO: "info", WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import {
  BIG_SKILL_KILL_LEARNING_FAILURE_KEY,
  persistLearnedBigKill,
} from "./big-skill-kill-learner-failure.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

beforeEach(() => {
  sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
});

function failedStore(message) {
  return async () => ({ outcome: StorageWriteOutcome.FAILED, error: new Error(message) });
}

describe("big-skill kill learning persistence failures", () => {
  it("does not report learned big-kill success when incremental storage fails", async () => {
    await expect(
      persistLearnedBigKill(
        [{ id: 100, value: { OFC: { nNoIm: 1 } } }],
        failedStore("big-kill learning write blocked")
      )
    ).resolves.toBe(false);

    expect(JSON.parse(sessionStorage.getItem(BIG_SKILL_KILL_LEARNING_FAILURE_KEY))).toMatchObject({
      capability: "bigSkillKillLearning",
      stage: "update-learned",
      failure: { kind: "storageWrite", error: "big-kill learning write blocked" },
    });
  });

  it("does not throw when big-kill failure evidence and diagnostics are blocked", async () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === BIG_SKILL_KILL_LEARNING_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    await expect(
      persistLearnedBigKill([], failedStore("big-kill learning write blocked"))
    ).resolves.toBe(false);
  });
});
