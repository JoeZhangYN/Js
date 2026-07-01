import { afterEach, describe, expect, it, vi } from "vitest";
import { NavigationEvent, NavigationReloadReason, runNavigationAutomation } from "./navigate.js";

describe("scheduled reload navigation detail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("preserves scheduled reload detail when the timer fires", () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const timer = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      reason: NavigationReloadReason.ACTION_WATCHDOG,
      seconds: 3,
      detail: { source: "battleActionDelay", seconds: 3 },
    });
    vi.advanceTimersByTime(3000);

    expect(warn).toHaveBeenCalledWith(
      "[HVAA] reload",
      expect.objectContaining({
        kind: "reload",
        reason: NavigationReloadReason.ACTION_WATCHDOG,
        detail: { source: "battleActionDelay", seconds: 3 },
      })
    );
    clearTimeout(timer);
    vi.clearAllTimers();
  });
});
