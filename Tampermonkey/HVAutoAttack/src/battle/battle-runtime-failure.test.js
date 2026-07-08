import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  delValue: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));
vi.mock("../state/storage.js", async () => {
  const actual = await vi.importActual("../state/storage.js");
  return { ...actual, delValue: mocks.delValue };
});

import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "./battle-runtime.js";
import { BATTLE_RUNTIME_FAILURE_KEY } from "./battle-runtime-failure.js";

beforeEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReturnValue(true);
  mocks.delValue.mockReset();
  mocks.delValue.mockReturnValue(undefined);
});

function lastFailure() {
  return JSON.parse(window.sessionStorage.getItem(BATTLE_RUNTIME_FAILURE_KEY));
}

describe("battle runtime persistence failures", () => {
  it("does not report session clear success when persisted clear fails", () => {
    mocks.delValue.mockImplementation(() => {
      throw new Error("clear blocked");
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
    mocks.delValue.mockImplementation(() => {
      throw new Error("clear blocked");
    });

    expect(() =>
      runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION })
    ).not.toThrow();
    expect(runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION })).toBe(false);
  });
});
