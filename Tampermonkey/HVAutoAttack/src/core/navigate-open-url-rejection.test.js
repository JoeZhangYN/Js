import { afterEach, describe, expect, it, vi } from "vitest";
import { NavigationEvent, NavigationRedirectReason, runNavigationAutomation } from "./navigate.js";

describe("open URL navigation rejection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("rejects URL opening when the browser blocks the navigation window", () => {
    vi.spyOn(window, "open").mockImplementation(() => null);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_URL,
        reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
        url: "https://hentaiverse.org/encounter.php",
      })
    ).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "rejected",
      detail: {
        opened: false,
        cause: "windowOpenBlocked",
      },
    });
  });
});
