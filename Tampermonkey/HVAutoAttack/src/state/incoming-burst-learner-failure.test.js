import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ runDiagnosticConsoleAutomation: vi.fn() }));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import {
  INCOMING_BURST_LEARNING_FAILURE_KEY,
  persistLearnedIncomingBurst,
} from "./incoming-burst-learner-failure.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

beforeEach(() => {
  sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
});

function failedStore(message) {
  return async () => ({ outcome: StorageWriteOutcome.FAILED, error: new Error(message) });
}

describe("incoming burst learning persistence failures", () => {
  it("does not report learned incoming burst success when incremental storage fails", async () => {
    await expect(
      persistLearnedIncomingBurst(
        [{ id: 100, value: { maxHit: 500, type: "cold" } }],
        failedStore("incoming burst learning write blocked")
      )
    ).resolves.toBe(false);

    expect(JSON.parse(sessionStorage.getItem(INCOMING_BURST_LEARNING_FAILURE_KEY))).toMatchObject({
      capability: "incomingBurstLearning",
      stage: "update-learned",
      failure: { kind: "storageWrite", error: "incoming burst learning write blocked" },
    });
  });

  it("does not throw when incoming burst failure evidence and diagnostics are blocked", async () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === INCOMING_BURST_LEARNING_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    await expect(
      persistLearnedIncomingBurst([], failedStore("incoming burst learning write blocked"))
    ).resolves.toBe(false);
  });
});
