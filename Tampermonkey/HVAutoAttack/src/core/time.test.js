import { describe, expect, it } from "vitest";
import { TimeEvent, runTimeAutomation } from "./time.js";

describe("runTimeAutomation", () => {
  it("reads epoch milliseconds through a named event", () => {
    expect(
      runTimeAutomation({
        type: TimeEvent.EPOCH_MS,
        stamp: Date.UTC(2026, 5, 27, 0, 0, 5),
      })
    ).toBe(Date.UTC(2026, 5, 27, 0, 0, 5));
  });

  it("reads UTC labels through named events", () => {
    const stamp = Date.UTC(2026, 5, 27, 0, 0, 5);

    expect(
      runTimeAutomation({
        type: TimeEvent.UTC_MONTH_DAY_LABEL,
        stamp,
      })
    ).toBe("6/27");
    expect(
      runTimeAutomation({
        type: TimeEvent.UTC_DATE_KEY,
        stamp,
      })
    ).toBe("2026/6/27");
  });

  it("returns undefined for unknown time events", () => {
    expect(runTimeAutomation({ type: "unknown", stamp: 0 })).toBeUndefined();
  });

  it("owns file-safe and ISO timestamp labels", () => {
    const stamp = Date.UTC(2026, 5, 27, 0, 0, 5);

    expect(runTimeAutomation({ type: TimeEvent.LOCAL_FILE_TIMESTAMP, stamp })).toBe(
      "2026-06-27_00-00-05"
    );
    expect(runTimeAutomation({ type: TimeEvent.ISO_TIMESTAMP, stamp })).toBe(
      "2026-06-27T00:00:05.000Z"
    );
  });
});
