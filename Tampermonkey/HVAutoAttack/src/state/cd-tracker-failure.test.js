import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  setValue: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue };
});

import { CD_RUNTIME_FAILURE_KEY, CdRuntimeEvent, runCdRuntimeAutomation } from "./cd-tracker.js";
import { g } from "./store.js";

beforeEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  g("globalTurn", 7);
  g("skillLastUsed", { OFC: 3 });
});

describe("cd runtime persistence failures", () => {
  it("does not report CD runtime persistence success when storage writes fail", () => {
    mocks.setValue.mockImplementation(() => {
      throw new Error("cd runtime write blocked");
    });

    expect(runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST })).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(CD_RUNTIME_FAILURE_KEY))).toMatchObject({
      capability: "cdRuntime",
      stage: "persist",
      failure: { kind: "storageWrite", error: "cd runtime write blocked" },
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] CD runtime failed",
        expect.objectContaining({ capability: "cdRuntime", stage: "persist" }),
      ],
    });
  });

  it("does not throw when CD runtime failure evidence and diagnostic console both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === CD_RUNTIME_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    mocks.setValue.mockImplementation(() => {
      throw new Error("cd runtime write blocked");
    });

    expect(() => runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST })).not.toThrow();
    expect(runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST })).toBe(false);
  });
});
