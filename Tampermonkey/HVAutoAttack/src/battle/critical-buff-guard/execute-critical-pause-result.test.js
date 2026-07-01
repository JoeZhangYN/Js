import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runAlarmAutomation: vi.fn(),
  runBattlePauseAutomation: vi.fn(),
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
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.runAlarmAutomation.mockReset();
  mocks.runBattlePauseAutomation.mockReset();
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
    expect(document.title).toContain("Spark of Life");
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
});
