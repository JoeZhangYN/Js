import { afterEach, describe, expect, it, vi } from "vitest";
import { recordNavigationContext } from "./navigation-audit.js";
import "./navigate.js";

describe("navigation external unload audit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("records page unloads that bypass the navigation entry", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    recordNavigationContext("battleTargetClick", { targetId: 2 });

    window.dispatchEvent(new Event("pagehide"));

    expect(warn).toHaveBeenCalledWith(
      "[HVAA] externalUnload",
      expect.objectContaining({
        kind: "externalUnload",
        reason: "outsideNavigationEntry",
        eventType: "pagehide",
        lastAction: expect.objectContaining({ kind: "battleTargetClick", targetId: 2 }),
      })
    );
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastNavigationAudit"))).toMatchObject({
      kind: "externalUnload",
      reason: "outsideNavigationEntry",
      eventType: "pagehide",
      lastAction: { kind: "battleTargetClick", targetId: 2 },
    });
  });
});
