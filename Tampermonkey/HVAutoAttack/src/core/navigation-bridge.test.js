import { afterEach, describe, expect, it, vi } from "vitest";

describe("navigation bridge", () => {
  afterEach(() => {
    delete window.HVAA_navigation;
    delete globalThis.unsafeWindow;
    sessionStorage.clear();
    vi.useRealTimers();
    vi.resetModules();
  });

  it("exposes navigation commands to both userscript and page contexts", async () => {
    globalThis.unsafeWindow = {};

    vi.resetModules();
    await import("./navigation-bridge.js");

    expect(window.HVAA_navigation.ReloadReason.BATTLE_API_RESPONSE).toBe("battleApiResponse");
    expect(window.HVAA_navigation.ReloadReason.BATTLE_API_CALLBACK_FALLBACK).toBe(
      "battleApiCallbackFallback"
    );
    expect(globalThis.unsafeWindow.HVAA_navigation.ReloadReason.BATTLE_API_RESPONSE).toBe(
      "battleApiResponse"
    );
    expect(globalThis.unsafeWindow.HVAA_navigation.reloadCurrentPage).toBe(
      window.HVAA_navigation.reloadCurrentPage
    );
  });

  it("passes reload detail through the bridge", async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    globalThis.unsafeWindow = {};

    vi.resetModules();
    await import("./navigation-bridge.js");

    window.HVAA_navigation.reloadCurrentPage("battleApiResponse", {
      responseKind: "jsonReload",
    });

    expect(warn).toHaveBeenCalledWith(
      "[HVAA] reload",
      expect.objectContaining({
        reason: "battleApiResponse",
        detail: { responseKind: "jsonReload" },
      })
    );
  });
});
