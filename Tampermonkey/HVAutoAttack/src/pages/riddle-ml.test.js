import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { RiddleMlEvent, runRiddleMlAutomation } from "./riddle-ml.js";

beforeEach(() => {
  localStorage.clear();
  runOptionAutomation({ type: OptionEvent.CLEAR });
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

  it("skips ML answering when the option entry reports mlAnswer disabled", async () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", mlAnswer: false },
    });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();
  });
});
