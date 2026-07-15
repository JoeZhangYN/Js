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

  it("ignores invalid day-record events", () => {
    expect(runDayRecordAutomation({ type: "unknown" })).toBeUndefined();
    expect(runDayRecordAutomation(null)).toBeUndefined();
    expect(mocks.runTimeAutomation).not.toHaveBeenCalled();
    expect(mocks.g).not.toHaveBeenCalled();
  });
});
