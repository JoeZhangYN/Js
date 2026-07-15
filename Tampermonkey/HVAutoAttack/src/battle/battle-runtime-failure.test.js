import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  runBattleSessionCheckpointAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));
vi.mock("../state/battle-session-checkpoint.js", () => {
  return {
    BattleSessionCheckpointEvent: Object.freeze({ CLEAR: "clear" }),
    runBattleSessionCheckpointAutomation: mocks.runBattleSessionCheckpointAutomation,
  };
});

import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "./battle-runtime.js";
import { BATTLE_RUNTIME_FAILURE_KEY } from "./battle-runtime-failure.js";

beforeEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReturnValue(true);
  mocks.runBattleSessionCheckpointAutomation.mockReset();
  mocks.runBattleSessionCheckpointAutomation.mockReturnValue({ outcome: "deleted" });
});

function lastFailure() {
  return JSON.parse(window.sessionStorage.getItem(BATTLE_RUNTIME_FAILURE_KEY));
}

describe("battle runtime persistence failures", () => {
  it("does not report session clear success when persisted clear fails", () => {
    mocks.runBattleSessionCheckpointAutomation.mockReturnValue({
      outcome: "failed",
      error: new Error("clear blocked"),
    });

    expect(runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION })).toBe(false);

    expect(lastFailure()).toMatchObject({
      capability: "battleRuntime",
      stage: "clear-session",
      failure: { kind: "storageDelete", error: "clear blocked" },
    });
  });

  it("does not throw when runtime failure evidence and typed warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === BATTLE_RUNTIME_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockReturnValue(false);
    mocks.runBattleSessionCheckpointAutomation.mockReturnValue({
      outcome: "failed",
      error: new Error("clear blocked"),
    });

    expect(() =>
      runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION })
    ).not.toThrow();
    expect(runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION })).toBe(false);
  });
});
