import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CriticalBuffPauseExecutionEvent,
  runCriticalBuffPauseExecution,
} from "./execute-critical-pause.js";

beforeEach(() => {
  document.title = "";
  document.body.innerHTML = '<button class="pauseChange"></button>';
  vi.spyOn(console, "warn").mockImplementation(() => {});
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

    expect(console.warn).toHaveBeenCalledOnce();
    expect(document.title).toContain("Spark of Life");
    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");
  });

  it("rejects unknown critical pause execution events", () => {
    expect(runCriticalBuffPauseExecution({ type: "unknown" })).toBe(false);

    expect(console.warn).not.toHaveBeenCalled();
    expect(document.title).toBe("");
    expect(document.querySelector(".pauseChange").innerHTML).toBe("");
  });
});
