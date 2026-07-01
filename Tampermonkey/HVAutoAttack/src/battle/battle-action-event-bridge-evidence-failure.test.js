import { beforeEach, describe, expect, it, vi } from "vitest";
import { runBattleActionEventBridgeAutomation } from "./battle-action-event-bridge.js";

const mocks = vi.hoisted(() => ({
  cE: vi.fn((tag) => document.createElement(tag)),
  gE: vi.fn((selector) => document.querySelector(selector)),
  runBattleActionLifecycleAutomation: vi.fn(),
  runBattleActionLifecycleEvidence: vi.fn(),
  runBattleApiBridgeAutomation: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({
  cE: mocks.cE,
  gE: mocks.gE,
}));
vi.mock("./battle-action-lifecycle.js", () => ({
  BattleActionLifecycleEvent: Object.freeze({
    ACTION_STARTED: "actionStarted",
    ACTION_ENDED: "actionEnded",
  }),
  runBattleActionLifecycleAutomation: mocks.runBattleActionLifecycleAutomation,
}));
vi.mock("./battle-action-lifecycle-evidence.js", () => ({
  BattleActionLifecycleEvidenceEvent: Object.freeze({ RECORD_LIFECYCLE: "recordLifecycle" }),
  runBattleActionLifecycleEvidence: mocks.runBattleActionLifecycleEvidence,
}));
vi.mock("./battle-api-bridge.js", () => ({
  BattleApiBridgeEvent: Object.freeze({ INSTALL: "install" }),
  runBattleApiBridgeAutomation: mocks.runBattleApiBridgeAutomation,
}));

beforeEach(() => {
  document.body.innerHTML = "";
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("battle action event bridge evidence failures", () => {
  it("rejects unknown bridge events when lifecycle evidence recording fails", () => {
    mocks.runBattleActionLifecycleEvidence.mockImplementation(() => {
      throw new Error("lifecycle evidence failed");
    });

    expect(() => runBattleActionEventBridgeAutomation({ type: "unknown" })).not.toThrow();
    expect(runBattleActionEventBridgeAutomation({ type: "unknown" })).toBe(false);
    expect(mocks.runBattleActionLifecycleAutomation).not.toHaveBeenCalled();
  });

  it("returns rejected bridge click result when evidence recording fails", () => {
    mocks.runBattleActionLifecycleAutomation.mockImplementation(() => {
      throw new Error("lifecycle failed");
    });
    mocks.runBattleActionLifecycleEvidence.mockImplementation(() => {
      throw new Error("lifecycle evidence failed");
    });
    runBattleActionEventBridgeAutomation();

    let result;
    expect(() => {
      result = document.getElementById("eventStart").onclick();
    }).not.toThrow();

    expect(result).toBe(false);
    expect(mocks.runBattleActionLifecycleEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({ reason: "actionLifecycleBridgeThrew" }),
      })
    );
  });
});
