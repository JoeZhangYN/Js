import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EncounterLobbyScheduleEvent,
  runEncounterLobbySchedule,
} from "./encounter-lobby-schedule.js";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T23:59:55.000Z"));
  runEncounterLobbySchedule({ type: EncounterLobbyScheduleEvent.CANCEL_NEXT_CHECK });
});

afterEach(() => {
  runEncounterLobbySchedule({ type: EncounterLobbyScheduleEvent.CANCEL_NEXT_CHECK });
  vi.useRealTimers();
});

describe("runEncounterLobbySchedule", () => {
  it("schedules the next lobby check from the encounter policy clock", async () => {
    const rerun = vi.fn();

    expect(
      runEncounterLobbySchedule({
        type: EncounterLobbyScheduleEvent.SCHEDULE_NEXT_CHECK,
        state: { date: Date.UTC(2026, 5, 27, 23, 45), key: "", count: 24, clear: true },
        rerun,
        jitter: 1,
      })
    ).toBe(true);

    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(9999);
    expect(rerun).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(rerun).toHaveBeenCalledTimes(1);
  });

  it("replaces an existing lobby check instead of running two schedules", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const state = { date: Date.now(), key: "", count: 0, clear: true };

    runEncounterLobbySchedule({
      type: EncounterLobbyScheduleEvent.SCHEDULE_NEXT_CHECK,
      state,
      rerun: first,
    });
    runEncounterLobbySchedule({
      type: EncounterLobbyScheduleEvent.SCHEDULE_NEXT_CHECK,
      state,
      rerun: second,
    });

    expect(vi.getTimerCount()).toBe(1);
    await vi.runOnlyPendingTimersAsync();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown and null schedule events without creating a timer", () => {
    expect(runEncounterLobbySchedule({ type: "unknown" })).toBe(false);
    expect(runEncounterLobbySchedule(null)).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
