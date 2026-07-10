import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  vi.resetModules();
});

describe("offline equipment percentile lifecycle", () => {
  it("returns an idempotent active disposer that removes listeners and styles", async () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    const { runOfflineEquipPercentileEnhancement } = await import("./equip-percentile-offline.js");

    const dispose = runOfflineEquipPercentileEnhancement();
    expect(typeof dispose).toBe("function");
    expect(document.head.querySelector("style")).not.toBeNull();
    expect(runOfflineEquipPercentileEnhancement()).toBe(dispose);

    dispose();

    expect(document.head.querySelector("style")).toBeNull();
    expect(removeListener).toHaveBeenCalledWith("keydown", expect.any(Function), true);
    const nextDispose = runOfflineEquipPercentileEnhancement();
    expect(nextDispose).not.toBe(dispose);
    nextDispose();
  });
});
