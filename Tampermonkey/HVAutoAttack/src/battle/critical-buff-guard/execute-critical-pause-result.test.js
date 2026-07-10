import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  runAlarmAutomation: vi.fn(),
  runBattlePauseAutomation: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));

vi.mock("../../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ BLOCKING_ERROR: "blockingError" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
}));

vi.mock("../../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("../../alarm/alarm.js", () => ({
  AlarmEvent: Object.freeze({ TRIGGER: "trigger" }),
  runAlarmAutomation: mocks.runAlarmAutomation,
}));

vi.mock("../pause-automation.js", () => ({
  BattlePauseEvent: Object.freeze({ PAUSE: "pause" }),
  runBattlePauseAutomation: mocks.runBattlePauseAutomation,
}));

import {
  CriticalBuffPauseExecutionEvent,
  runCriticalBuffPauseExecution,
} from "./execute-critical-pause.js";

beforeEach(() => {
  window.sessionStorage.clear();
  document.title = "";
  document.body.innerHTML = '<button class="pauseChange"></button>';
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReturnValue(true);
  mocks.runAlarmAutomation.mockReset();
  mocks.runBattlePauseAutomation.mockReset();
  mocks.runUserFeedbackAutomation.mockReset();
});

describe("critical buff pause execution result semantics", () => {
  it("returns not acted when the pause entry rejects the critical pause", () => {
    const plan = { name: "Spark of Life", turns: 1, mp: 10, mpFloor: 30 };
    mocks.runBattlePauseAutomation.mockReturnValue(false);

    expect(
      runCriticalBuffPauseExecution({
        type: CriticalBuffPauseExecutionEvent.APPLY_PLAN,
        plan,
      })
    ).toBe(false);

    expect(mocks.runAlarmAutomation).toHaveBeenCalledWith({ type: "trigger", kind: "Error" });
    expect(mocks.runBattlePauseAutomation).toHaveBeenCalledWith({
      type: "pause",
      reason: "criticalBuff",
      detail: expect.objectContaining({ ...plan, alarmResult: false }),
    });
    expect(document.title).toBe("");
    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blockingError",
        evidence: expect.objectContaining({ reason: "criticalPauseFailed", plan }),
      })
    );
  });

  it("still pauses when the alarm side effect fails", () => {
    const plan = { name: "Spark of Life", turns: 1, mp: 10, mpFloor: 30 };
    mocks.runAlarmAutomation.mockImplementation(() => {
      throw new Error("alarm failed");
    });
    mocks.runBattlePauseAutomation.mockReturnValue(true);

    expect(
      runCriticalBuffPauseExecution({
        type: CriticalBuffPauseExecutionEvent.APPLY_PLAN,
        plan,
      })
    ).toBe(true);

    expect(mocks.runBattlePauseAutomation).toHaveBeenCalledWith({
      type: "pause",
      reason: "criticalBuff",
      detail: expect.objectContaining({
        ...plan,
        alarmResult: false,
        alarmError: "alarm failed",
      }),
    });
  });

  it("records typed alarm failures as not triggered while still pausing", () => {
    const plan = { name: "Spark of Life", turns: 1, mp: 10, mpFloor: 30 };
    mocks.runAlarmAutomation.mockReturnValue({
      kind: "failed",
      reason: "alarmTriggerRejected",
    });
    mocks.runBattlePauseAutomation.mockReturnValue(true);

    expect(
      runCriticalBuffPauseExecution({
        type: CriticalBuffPauseExecutionEvent.APPLY_PLAN,
        plan,
      })
    ).toBe(true);

    expect(mocks.runBattlePauseAutomation).toHaveBeenCalledWith({
      type: "pause",
      reason: "criticalBuff",
      detail: expect.objectContaining({
        ...plan,
        alarmResult: false,
      }),
    });
  });

  it("still pauses when the typed warning side effect fails", () => {
    const plan = { name: "Spark of Life", turns: 1, mp: 10, mpFloor: 30 };
    mocks.runDiagnosticConsoleAutomation.mockReturnValue(false);
    mocks.runAlarmAutomation.mockReturnValue(true);
    mocks.runBattlePauseAutomation.mockReturnValue(true);

    expect(
      runCriticalBuffPauseExecution({
        type: CriticalBuffPauseExecutionEvent.APPLY_PLAN,
        plan,
      })
    ).toBe(true);

    expect(mocks.runBattlePauseAutomation).toHaveBeenCalledWith({
      type: "pause",
      reason: "criticalBuff",
      detail: expect.objectContaining({
        ...plan,
        warningOk: false,
        warningError: "diagnostic console blocked",
        alarmResult: true,
      }),
    });
  });
});
