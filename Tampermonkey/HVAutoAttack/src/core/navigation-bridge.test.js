import { afterEach, describe, expect, it, vi } from "vitest";

describe("navigation bridge", () => {
  afterEach(() => {
    delete window.HVAA_navigation;
    delete globalThis.unsafeWindow;
    vi.resetModules();
  });

  it("exposes navigation commands to both userscript and page contexts", async () => {
    globalThis.unsafeWindow = {};

    vi.resetModules();
    await import("./navigation-bridge.js");

    expect(window.HVAA_navigation.ReloadReason.BATTLE_API_RESPONSE).toBe("battleApiResponse");
    expect(globalThis.unsafeWindow.HVAA_navigation.ReloadReason.BATTLE_API_RESPONSE).toBe(
      "battleApiResponse"
    );
    expect(globalThis.unsafeWindow.HVAA_navigation.reloadCurrentPage).toBe(
      window.HVAA_navigation.reloadCurrentPage
    );
  });
});
