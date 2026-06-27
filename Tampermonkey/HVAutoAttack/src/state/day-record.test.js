import { beforeEach, describe, expect, it, vi } from "vitest";
import { DayRecordEvent, runDayRecordAutomation } from "./day-record.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  runTimeAutomation: vi.fn(() => "2026/6/27"),
}));

vi.mock("./store.js", () => ({ g: mocks.g }));
vi.mock("../core/time.js", () => ({
  TimeEvent: Object.freeze({ UTC_DATE_KEY: "utcDateKey" }),
  runTimeAutomation: mocks.runTimeAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runTimeAutomation.mockReturnValue("2026/6/27");
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
});
