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
        attempt: 1,
        retryDelayMs: 5000,
        detail: { source: "battleActionDelay", seconds: 3 },
      })
    );
    clearTimeout(timer);
    vi.clearAllTimers();
  });

  it("records reload retry attempts separately from the initial reload", () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    runNavigationAutomation({
      type: NavigationEvent.RELOAD_NOW,
      reason: NavigationReloadReason.BATTLE_API_RESPONSE,
      detail: { recoveryAction: "reload" },
    });
    vi.advanceTimersByTime(5000);

    expect(warn).toHaveBeenCalledWith(
      "[HVAA] reload",
      expect.objectContaining({
        reason: NavigationReloadReason.BATTLE_API_RESPONSE,
        attempt: 1,
        retryDelayMs: 5000,
        detail: { recoveryAction: "reload" },
      })
    );
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] reload",
      expect.objectContaining({
        reason: NavigationReloadReason.BATTLE_API_RESPONSE,
        attempt: 2,
        retryDelayMs: 5000,
        detail: { recoveryAction: "reload" },
      })
    );
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "accepted",
      commandReason: NavigationReloadReason.BATTLE_API_RESPONSE,
      detail: {
        attempt: 2,
        retryDelayMs: 5000,
        detail: { recoveryAction: "reload" },
      },
    });
    vi.clearAllTimers();
  });
});
