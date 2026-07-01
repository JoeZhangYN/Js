import { describe, expect, it, vi } from "vitest";
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "./navigate.js";

describe("runNavigationAutomation", () => {
  it("routes URL opening through the navigation event entry", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_URL,
        url: "https://hentaiverse.org/encounter.php",
        newTab: true,
      })
    ).toBe(true);

    expect(open).toHaveBeenCalledWith("https://hentaiverse.org/encounter.php", "_blank");
  });

  it("routes named popup windows through the navigation event entry", () => {
    const popup = { close: vi.fn() };
    const open = vi.spyOn(window, "open").mockImplementation(() => popup);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_WINDOW,
        url: "https://hentaiverse.org/?s=Battle",
        name: "riddleWindow",
        features: "resizable,scrollbars,width=1241,height=707",
      })
    ).toBe(popup);

    expect(open).toHaveBeenCalledWith(
      "https://hentaiverse.org/?s=Battle",
      "riddleWindow",
      "resizable,scrollbars,width=1241,height=707"
    );
  });

  it("returns the scheduled reload timer handle", () => {
    vi.useFakeTimers();

    const timer = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      reason: NavigationReloadReason.ACTION_WATCHDOG,
      seconds: 3,
    });

    expect(timer).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    clearTimeout(timer);

    vi.useRealTimers();
  });

  it("normalizes reload delay units inside the navigation entry", () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    const secondsTimer = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      reason: NavigationReloadReason.ACTION_WATCHDOG,
      seconds: 3,
    });
    const minutesTimer = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      reason: NavigationReloadReason.PAGE_REFRESH,
      minutes: 5,
    });
    const millisecondsTimer = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      reason: NavigationReloadReason.ACTION_WATCHDOG,
      milliseconds: 250,
    });

    expect(secondsTimer).toBeTruthy();
    expect(minutesTimer).toBeTruthy();
    expect(millisecondsTimer).toBeTruthy();
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 3000);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 5 * 60 * 1000);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(3, expect.any(Function), 250);
    expect(vi.getTimerCount()).toBe(3);
    clearTimeout(secondsTimer);
    clearTimeout(minutesTimer);
    clearTimeout(millisecondsTimer);
    setTimeoutSpy.mockRestore();

    vi.useRealTimers();
  });

  it("rejects destructive reload events without an allowed reason", () => {
    vi.useFakeTimers();

    expect(runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW })).toBe(false);
    expect(
      runNavigationAutomation({
        type: NavigationEvent.SCHEDULE_RELOAD,
        seconds: 3,
      })
    ).toBe(false);

    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("rejects non-positive scheduled reload delays", () => {
    vi.useFakeTimers();

    for (const event of [
      {
        type: NavigationEvent.SCHEDULE_RELOAD,
        reason: NavigationReloadReason.ACTION_WATCHDOG,
        seconds: 0,
      },
      {
        type: NavigationEvent.SCHEDULE_RELOAD,
        reason: NavigationReloadReason.ACTION_WATCHDOG,
        milliseconds: -1,
      },
    ]) {
      expect(runNavigationAutomation(event)).toBe(false);
    }

    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("rejects unknown navigation events", () => {
    expect(runNavigationAutomation({ type: "unknown" })).toBe(false);
  });
});
