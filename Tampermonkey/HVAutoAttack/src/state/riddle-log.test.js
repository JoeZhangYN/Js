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

  it("renders report rows newest first and escapes log text", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-06-27T00:00:00Z"));
      runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "<old>" });
      vi.setSystemTime(new Date("2026-06-27T00:01:00Z"));
      runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "<new>" });

      const html = runRiddleLogAutomation({ type: RiddleLogEvent.RENDER_REPORT_ROWS });

      expect(html).toContain("Run log (last 2)");
      expect(html.indexOf("&lt;new&gt;")).toBeLessThan(html.indexOf("&lt;old&gt;"));
    } finally {
      vi.useRealTimers();
    }
  });
});
