import { describe, expect, it, vi } from "vitest";
import { NavigationEvent, runNavigationAutomation } from "./navigate.js";

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

  it("returns the scheduled reload timer handle", () => {
    vi.useFakeTimers();

    const timer = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      sec: 3,
    });

    expect(timer).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    clearTimeout(timer);

    vi.useRealTimers();
  });

  it("rejects unknown navigation events", () => {
    expect(runNavigationAutomation({ type: "unknown" })).toBe(false);
  });
});
