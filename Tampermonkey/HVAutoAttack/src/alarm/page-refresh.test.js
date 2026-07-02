import { describe, expect, it, vi } from "vitest";
import { PageRefreshEvent, runPageRefreshAutomation } from "./page-refresh.js";

describe("runPageRefreshAutomation", () => {
  it("does not schedule reload when periodic page refresh is disabled", () => {
    const scheduleReload = vi.fn();
    const readOptionField = vi.fn((key, fallback) =>
      key === "pageRefresh" ? false : fallback
    );

    expect(
      runPageRefreshAutomation(
        {
          type: PageRefreshEvent.GAME_PAGE_READY,
        },
        { readOptionField, scheduleReload }
      )
    ).toBe(false);
    expect(readOptionField).toHaveBeenCalledWith("pageRefresh", false);
    expect(readOptionField).toHaveBeenCalledWith("pageRefreshMinutes", 30);
    expect(scheduleReload).not.toHaveBeenCalled();
  });

  it("schedules through the entry with configured minutes without exceeding the configured limit", () => {
    const scheduleReload = vi.fn();
    const readOptionField = vi.fn((key, fallback) => {
      if (key === "pageRefresh") return true;
      if (key === "pageRefreshMinutes") return 30;
      return fallback;
    });

    expect(
      runPageRefreshAutomation(
        {
          type: PageRefreshEvent.GAME_PAGE_READY,
        },
        {
          jitter: 0,
          readOptionField,
          scheduleReload,
        }
      )
    ).toBe(true);
    expect(scheduleReload).toHaveBeenLastCalledWith(30);

    expect(
      runPageRefreshAutomation(
        {
          type: PageRefreshEvent.GAME_PAGE_READY,
        },
        {
          jitter: 1,
          readOptionField,
          scheduleReload,
        }
      )
    ).toBe(true);
    expect(scheduleReload).toHaveBeenLastCalledWith(30);
  });

  it("schedules unknown page reload through the same refresh entry", () => {
    const scheduleReload = vi.fn();

    expect(
      runPageRefreshAutomation(
        {
          type: PageRefreshEvent.UNKNOWN_PAGE_READY,
        },
        { scheduleReload }
      )
    ).toBe(true);

    expect(scheduleReload).toHaveBeenCalledWith(5);
  });

  it("ignores unknown refresh events", () => {
    const scheduleReload = vi.fn();

    expect(runPageRefreshAutomation({ type: "unknown" }, { scheduleReload })).toBe(false);
    expect(runPageRefreshAutomation(null, { scheduleReload })).toBe(false);
    expect(scheduleReload).not.toHaveBeenCalled();
  });
});
