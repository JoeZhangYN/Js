import { beforeEach, describe, expect, it, vi } from "vitest";
import { RiddleLogEvent, runRiddleLogAutomation } from "./riddle-log.js";

beforeEach(() => {
  localStorage.clear();
});

describe("riddle log entry", () => {
  it("pushes, truncates, and reads log entries through the entry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T00:00:00Z"));
    try {
      runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "x".repeat(350) });

      const [entry] = runRiddleLogAutomation({ type: RiddleLogEvent.READ });
      expect(entry.t).toBeTruthy();
      expect(entry.m).toBe("x".repeat(300));
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears log entries through the entry", () => {
    runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "one" });

    expect(runRiddleLogAutomation({ type: RiddleLogEvent.CLEAR })).toEqual([]);
    expect(runRiddleLogAutomation({ type: RiddleLogEvent.READ })).toEqual([]);
  });
});
