import { afterEach, describe, expect, it, vi } from "vitest";
import { NavigationEvent, NavigationWindowReason, runNavigationAutomation } from "./navigate.js";

describe("open window navigation audit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("records named popup windows with an allowed reason", () => {
    const popup = { close: vi.fn() };
    vi.spyOn(window, "open").mockImplementation(() => popup);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_WINDOW,
        reason: NavigationWindowReason.RIDDLE_POPUP,
        url: "https://hentaiverse.org/?s=Battle",
        name: "riddleWindow",
        features: "resizable,scrollbars,width=1241,height=707",
      })
    ).toBe(popup);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationAudit"))).toMatchObject({
      kind: "openWindow",
      reason: NavigationWindowReason.RIDDLE_POPUP,
      name: "riddleWindow",
      opened: true,
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "accepted",
      eventType: NavigationEvent.OPEN_WINDOW,
      commandReason: NavigationWindowReason.RIDDLE_POPUP,
      detail: {
        name: "riddleWindow",
        opened: true,
      },
    });
  });

  it("records blocked popup windows as rejected decisions without hiding the audit", () => {
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
      opened: false,
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "rejected",
      eventType: NavigationEvent.OPEN_WINDOW,
      commandReason: NavigationWindowReason.RIDDLE_POPUP,
      detail: {
        name: "riddleWindow",
        opened: false,
        cause: "windowOpenBlocked",
      },
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
