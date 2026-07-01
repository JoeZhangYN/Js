import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NavigationEvent,
  NavigationWindowReason,
  runNavigationAutomation,
} from "./navigate.js";

describe("open window navigation audit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("records named popup windows with an allowed reason", () => {
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_WINDOW,
        reason: NavigationWindowReason.RIDDLE_POPUP,
        url: "https://hentaiverse.org/?s=Battle",
        name: "riddleWindow",
        features: "resizable,scrollbars,width=1241,height=707",
      })
    ).toBeNull();

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationAudit"))).toMatchObject({
      kind: "openWindow",
      reason: NavigationWindowReason.RIDDLE_POPUP,
      name: "riddleWindow",
    });
  });

  it("rejects named popup windows without an allowed reason", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_WINDOW,
        url: "https://hentaiverse.org/?s=Battle",
        name: "riddleWindow",
      })
    ).toBe(false);

    expect(open).not.toHaveBeenCalled();
  });
});
