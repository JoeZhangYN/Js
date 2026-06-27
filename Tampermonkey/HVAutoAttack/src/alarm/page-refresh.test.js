import { describe, expect, it, vi } from "vitest";
import { PageRefreshEvent, runPageRefreshAutomation } from "./page-refresh.js";

describe("runPageRefreshAutomation", () => {
  it("does not schedule reload when periodic page refresh is disabled", () => {
    const scheduleReload = vi.fn();

    expect(
      runPageRefreshAutomation(
        {
          type: PageRefreshEvent.GAME_PAGE_READY,
          option: { pageRefresh: false, pageRefreshMinutes: 30 },
        },
        { scheduleReload }
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
          option: { pageRefresh: true, pageRefreshMinutes: 30 },
        },
        { jitter: 0, scheduleReload }
      )
    ).toBe(true);
    expect(scheduleReload).toHaveBeenLastCalledWith(30 * 60);

    expect(
      runPageRefreshAutomation(
        {
          type: PageRefreshEvent.GAME_PAGE_READY,
          option: { pageRefresh: true, pageRefreshMinutes: 30 },
        },
        { jitter: 1, scheduleReload }
      )
    ).toBe(true);
    expect(scheduleReload).toHaveBeenLastCalledWith(31 * 60);
  });
});
