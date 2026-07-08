import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  setValue: vi.fn(),
  delValue: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue, delValue: mocks.delValue };
});

import { RiddleLogEvent, runRiddleLogAutomation } from "./riddle-log.js";
import { RIDDLE_LOG_FAILURE_KEY } from "./riddle-log-failure.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.setValue.mockReset();
  mocks.delValue.mockReset();
  mocks.setValue.mockImplementation((item, value) => {
    window.localStorage[`hvAA_${item}`] = typeof value === "string" ? value : JSON.stringify(value);
  });
  mocks.delValue.mockImplementation((item) => {
    window.localStorage.removeItem(`hvAA_${item}`);
  });
});

describe("riddle log persistence failures", () => {
  it("does not report riddle log push success when storage write fails", () => {
    mocks.setValue.mockImplementation(() => {
      throw new Error("riddle log write blocked");
    });

    expect(runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "kept" })).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(RIDDLE_LOG_FAILURE_KEY))).toMatchObject({
      capability: "riddleLog",
      stage: "persist",
      failure: { kind: "storageWrite", error: "riddle log write blocked" },
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] riddle log persistence failed",
        expect.objectContaining({ capability: "riddleLog", stage: "persist" }),
      ],
    });
  });

  it("does not report riddle log clear success when storage delete fails", () => {
    mocks.delValue.mockImplementation(() => {
      throw new Error("riddle log delete blocked");
    });

    expect(runRiddleLogAutomation({ type: RiddleLogEvent.CLEAR })).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(RIDDLE_LOG_FAILURE_KEY))).toMatchObject({
      capability: "riddleLog",
      stage: "clear",
      failure: { kind: "storageWrite", error: "riddle log delete blocked" },
    });
  });

  it("does not throw when riddle log failure evidence and diagnostic console both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === RIDDLE_LOG_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    mocks.setValue.mockImplementation(() => {
      throw new Error("riddle log write blocked");
    });

    expect(() =>
      runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "kept" })
    ).not.toThrow();
    expect(runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "kept" })).toBe(false);
  });
});
