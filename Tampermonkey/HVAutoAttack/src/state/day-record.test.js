import { beforeEach, describe, expect, it, vi } from "vitest";
import { DayRecordEvent, runDayRecordAutomation } from "./day-record.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  runTimeAutomation: vi.fn(() => "2026/6/27"),
}));

vi.mock("./store.js", () => ({ g: mocks.g }));
vi.mock("../core/time.js", () => ({
  TimeEvent: Object.freeze({
    EPOCH_MS: "epochMs",
    UTC_DATE_KEY: "utcDateKey",
    MS_UNTIL_NEXT_UTC_DAY: "msUntilNextUtcDay",
  }),
  runTimeAutomation: mocks.runTimeAutomation,
}));

beforeEach(() => {
  runDayRecordAutomation({
    type: DayRecordEvent.REFRESH_AND_SCHEDULE_NEXT_UTC_DAY,
    cancel: vi.fn(),
  });
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runTimeAutomation.mockImplementation((event) =>
    event.type === "msUntilNextUtcDay" ? 5000 : "2026/6/27"
  );
  mocks.g.mockReturnValue(undefined);
});

describe("runDayRecordAutomation", () => {
  it("syncs the UTC date record through one entry", () => {
    expect(runDayRecordAutomation({ type: DayRecordEvent.SYNC_UTC_DATE })).toBe("2026/6/27");

    expect(mocks.runTimeAutomation).toHaveBeenCalledWith({ type: "utcDateKey" });
    expect(mocks.g).toHaveBeenCalledWith("dateNow");
    expect(mocks.g).toHaveBeenCalledWith("dateNow", "2026/6/27");
  });

  it("does not rewrite the date record when it is already current", () => {
    mocks.g.mockReturnValue("2026/6/27");

    expect(runDayRecordAutomation({ type: DayRecordEvent.SYNC_UTC_DATE })).toBe("2026/6/27");

    expect(mocks.g).toHaveBeenCalledTimes(1);
    expect(mocks.g).toHaveBeenCalledWith("dateNow");
  });

  it("refreshes the date record and schedules the next UTC day rollover", () => {
    const schedule = vi.fn(() => "day-timer");
    const cancel = vi.fn();
    const rerun = vi.fn();

    expect(
      runDayRecordAutomation({
        type: DayRecordEvent.REFRESH_AND_SCHEDULE_NEXT_UTC_DAY,
        nowMs: Date.UTC(2026, 5, 27, 23, 59, 55),
        schedule,
        cancel,
        rerun,
      })
    ).toBe("2026/6/27");

    expect(schedule).toHaveBeenCalledWith(expect.any(Function), 10000);
    expect(mocks.runTimeAutomation).toHaveBeenCalledWith({
      type: "msUntilNextUtcDay",
      stamp: Date.UTC(2026, 5, 27, 23, 59, 55),
    });

    schedule.mock.calls[0][0]();
    expect(rerun).toHaveBeenCalledTimes(1);
  });

  it("cancels the previous UTC day rollover timer before scheduling a new one", () => {
    const schedule = vi
      .fn()
      .mockReturnValueOnce("old-day-timer")
      .mockReturnValueOnce("new-day-timer");
    const cancel = vi.fn();
    const rerun = vi.fn();

    runDayRecordAutomation({
      type: DayRecordEvent.REFRESH_AND_SCHEDULE_NEXT_UTC_DAY,
      nowMs: Date.UTC(2026, 5, 27, 23, 59, 55),
      schedule,
      cancel,
      rerun,
    });
    runDayRecordAutomation({
      type: DayRecordEvent.REFRESH_AND_SCHEDULE_NEXT_UTC_DAY,
      nowMs: Date.UTC(2026, 5, 27, 23, 59, 56),
      schedule,
      cancel,
      rerun,
    });

    expect(cancel).toHaveBeenCalledWith("old-day-timer");
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it("ignores unknown day-record events", () => {
    expect(runDayRecordAutomation({ type: "unknown" })).toBeUndefined();
    expect(mocks.runTimeAutomation).not.toHaveBeenCalled();
    expect(mocks.g).not.toHaveBeenCalled();
  });
});
