import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PAGE_REFRESH_FAILURE_KEY,
  PageRefreshEvent,
  runPageRefreshAutomation,
} from "./page-refresh.js";

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

function lastPageRefreshFailure() {
  return JSON.parse(sessionStorage.getItem(PAGE_REFRESH_FAILURE_KEY));
}

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

  it("does not report scheduled reload success when the reload adapter fails", () => {
    const scheduleReload = vi.fn(() => {
      throw new Error("timer blocked");
    });

    expect(
      runPageRefreshAutomation(
        { type: PageRefreshEvent.UNKNOWN_PAGE_READY },
        { scheduleReload }
      )
    ).toBe(false);

    expect(lastPageRefreshFailure()).toMatchObject({
      capability: "pageRefresh",
      stage: "scheduleReload",
      reason: "scheduleFailed",
      minutes: 5,
      error: "timer blocked",
    });
  });

  it("keeps reload scheduling failure evidence when diagnostic console is blocked", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });

    expect(
      runPageRefreshAutomation(
        { type: PageRefreshEvent.UNKNOWN_PAGE_READY },
        {
          scheduleReload: () => {
            throw new Error("navigation blocked");
          },
        }
      )
    ).toBe(false);

    expect(lastPageRefreshFailure()).toMatchObject({
      stage: "scheduleReload",
      reason: "scheduleFailed",
      error: "navigation blocked",
    });
  });
});
