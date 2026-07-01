import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NavigationEvent,
  NavigationRedirectReason,
  NavigationReloadReason,
  runNavigationAutomation,
} from "./navigate.js";

function readNavigationDecision() {
  return JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"));
}

describe("navigation decision evidence", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("records accepted URL navigation decisions without replacing navigation audit", () => {
    vi.spyOn(window, "open").mockImplementation(() => ({ close: vi.fn() }));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_URL,
        reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
        url: "https://hentaiverse.org/encounter.php",
        newTab: true,
      })
    ).toBe(true);

    expect(readNavigationDecision()).toMatchObject({
      decision: "accepted",
      eventType: NavigationEvent.OPEN_URL,
      commandReason: NavigationRedirectReason.ENCOUNTER_ENTRY,
      detail: {
        url: "https://hentaiverse.org/encounter.php",
        newTab: true,
        opened: true,
      },
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationAudit"))).toMatchObject({
      kind: "navigate",
      reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
    });
  });

  it("records accepted scheduled reload decisions", () => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const timer = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      reason: NavigationReloadReason.ACTION_WATCHDOG,
      milliseconds: 250,
      detail: { source: "test" },
    });

    expect(timer).toBeTruthy();
    expect(readNavigationDecision()).toMatchObject({
      decision: "accepted",
      eventType: NavigationEvent.SCHEDULE_RELOAD,
      commandReason: NavigationReloadReason.ACTION_WATCHDOG,
      detail: {
        delayMs: 250,
        detail: { source: "test" },
      },
    });
    clearTimeout(timer);
  });

  it("records rejected redirect reason decisions", () => {
    vi.spyOn(window, "open").mockImplementation(() => null);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_URL,
        url: "https://hentaiverse.org/encounter.php",
      })
    ).toBe(false);

    expect(readNavigationDecision()).toMatchObject({
      decision: "rejected",
      eventType: NavigationEvent.OPEN_URL,
      commandReason: null,
      detail: {
        cause: "redirectReasonNotAllowed",
        url: "https://hentaiverse.org/encounter.php",
      },
    });
    expect(sessionStorage.getItem("HVAA:lastNavigationAudit")).toBeNull();
  });

  it("records rejected reload and delay decisions", () => {
    vi.useFakeTimers();

    expect(runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW })).toBe(false);
    expect(readNavigationDecision()).toMatchObject({
      decision: "rejected",
      commandReason: null,
      detail: { cause: "reloadReasonNotAllowed" },
    });

    expect(
      runNavigationAutomation({
        type: NavigationEvent.SCHEDULE_RELOAD,
        reason: NavigationReloadReason.ACTION_WATCHDOG,
        seconds: 0,
      })
    ).toBe(false);
    expect(readNavigationDecision()).toMatchObject({
      decision: "rejected",
      detail: { cause: "invalidReloadDelay" },
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(sessionStorage.getItem("HVAA:lastNavigationAudit")).toBeNull();
  });

  it("records unknown navigation event decisions", () => {
    expect(runNavigationAutomation({ type: "unknown" })).toBe(false);

    expect(readNavigationDecision()).toMatchObject({
      decision: "rejected",
      eventType: "unknown",
      detail: { cause: "unknownNavigationEvent" },
    });
  });

  it("warns with structured evidence when decision storage is unavailable", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("write blocked");
    });

    expect(runNavigationAutomation({ type: "unknown" })).toBe(false);

    expect(warn).toHaveBeenCalledWith(
      "[HVAA] navigation decision",
      expect.objectContaining({
        decision: "rejected",
        eventType: "unknown",
        storageWriteOk: false,
        storageWriteError: "write blocked",
        detail: { cause: "unknownNavigationEvent" },
      })
    );
  });
});
