import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import {
  CriticalBuffPauseExecutionEvent,
  runCriticalBuffPauseExecution,
} from "./execute-critical-pause.js";

beforeEach(() => {
  sessionStorage.clear();
  document.title = "";
  document.body.innerHTML = '<button class="pauseChange"></button>';
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runCriticalBuffPauseExecution", () => {
  it("applies critical pause side effects through one entry", () => {
    expect(
      runCriticalBuffPauseExecution({
        type: CriticalBuffPauseExecutionEvent.APPLY_PLAN,
        plan: { name: "Spark of Life", turns: 1, mp: 10, mpFloor: 30 },
      })
    ).toBe(true);

    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [expect.stringContaining("[critical-buff-guard]")],
    });
    expect(document.title).toContain("Spark of Life");
    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");
  });

  it("rejects unknown critical pause execution events", () => {
    expect(runCriticalBuffPauseExecution({ type: "unknown" })).toBe(false);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "rejected",
      reason: "unknownCriticalPauseExecutionEvent",
      detail: { eventType: "unknown" },
    });

    sessionStorage.clear();
    expect(runCriticalBuffPauseExecution(null)).toBe(false);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "rejected",
      reason: "unknownCriticalPauseExecutionEvent",
      detail: { eventType: null },
    });

    expect(mocks.runDiagnosticConsoleAutomation).not.toHaveBeenCalled();
    expect(document.title).toBe("");
    expect(document.querySelector(".pauseChange").innerHTML).toBe("");
  });

  it("rejects missing critical pause plans as not acted with evidence", () => {
    expect(
      runCriticalBuffPauseExecution({ type: CriticalBuffPauseExecutionEvent.APPLY_PLAN })
    ).toBe(false);

    expect(mocks.runDiagnosticConsoleAutomation).not.toHaveBeenCalled();
    expect(document.title).toBe("");
    expect(document.querySelector(".pauseChange").innerHTML).toBe("");
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "rejected",
      reason: "invalidCriticalBuffPausePlan",
    });
  });
});
