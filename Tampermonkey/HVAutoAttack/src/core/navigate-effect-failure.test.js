import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NavigationEvent,
  NavigationRedirectReason,
  NavigationWindowReason,
  runNavigationAutomation,
} from "./navigate.js";

describe("navigation effect failures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("records URL navigation effect exceptions as rejected decisions", () => {
    vi.spyOn(window, "open").mockImplementation(() => {
      throw new Error("open failed");
    });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_URL,
        reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
        url: "https://hentaiverse.org/encounter.php",
        newTab: true,
      })
    ).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "rejected",
      eventType: NavigationEvent.OPEN_URL,
      commandReason: NavigationRedirectReason.ENCOUNTER_ENTRY,
      detail: {
        url: "https://hentaiverse.org/encounter.php",
        opened: false,
        cause: "navigationEffectFailed",
        error: "open failed",
      },
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationAudit"))).toMatchObject({
      kind: "navigateFailed",
      reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
      opened: false,
      cause: "navigationEffectFailed",
      error: "open failed",
    });
  });

  it("records popup navigation effect exceptions as rejected decisions", () => {
    vi.spyOn(window, "open").mockImplementation(() => {
      throw new Error("popup failed");
    });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_WINDOW,
        reason: NavigationWindowReason.RIDDLE_POPUP,
        url: "https://hentaiverse.org/?s=Battle",
        name: "riddleWindow",
        features: "width=100,height=100",
      })
    ).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "rejected",
      eventType: NavigationEvent.OPEN_WINDOW,
      commandReason: NavigationWindowReason.RIDDLE_POPUP,
      detail: {
        url: "https://hentaiverse.org/?s=Battle",
        name: "riddleWindow",
        opened: false,
        cause: "navigationEffectFailed",
        error: "popup failed",
      },
    });
  });
});
