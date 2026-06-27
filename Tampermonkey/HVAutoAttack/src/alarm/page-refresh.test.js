import { describe, expect, it, vi } from "vitest";
import { PageRefreshEvent, runPageRefreshAutomation } from "./page-refresh.js";

describe("runPageRefreshAutomation", () => {
  it("does not schedule reload when periodic page refresh is disabled", () => {
    const scheduleReload = vi.fn();

    expect(
      runPageRefreshAutomation(
        {
          type: PageRefreshEvent.GAME_PAGE_READY,
        },
        { readOption: () => ({ pageRefresh: false, pageRefreshMinutes: 30 }), scheduleReload }
      )
    ).toBe(false);
    expect(scheduleReload).not.toHaveBeenCalled();
  });

  it("schedules through the entry with configured minutes and bounded minute jitter", () => {
    const scheduleReload = vi.fn();

    expect(
      runPageRefreshAutomation(
        {
          type: PageRefreshEvent.GAME_PAGE_READY,
        },
        {
          jitter: 0,
          readOption: () => ({ pageRefresh: true, pageRefreshMinutes: 30 }),
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
          readOption: () => ({ pageRefresh: true, pageRefreshMinutes: 30 }),
          scheduleReload,
        }
      )
    ).toBe(true);
    expect(scheduleReload).toHaveBeenLastCalledWith(31);
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
});
