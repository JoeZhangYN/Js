import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RiddleMlEvent, runRiddleMlAutomation } from "./riddle-ml.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("riddle ML entry", () => {
  it("starts the health check timer through the entry only once", () => {
    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);
    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);

    expect(vi.getTimerCount()).toBe(1);
  });
});
