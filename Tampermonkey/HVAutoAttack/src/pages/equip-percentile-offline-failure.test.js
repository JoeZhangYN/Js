import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadSubject() {
  vi.resetModules();
  return import("./equip-percentile-offline.js");
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("runOfflineEquipPercentileEnhancement failure fallback", () => {
  it("records persisted display preference failures when the hotkey toggles percent mode", async () => {
    const { runOfflineEquipPercentileEnhancement } = await loadSubject();
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === "hvAA_equipPercentile_offline_showPercent") {
        throw new Error("preference write blocked");
      }
      return originalSetItem.call(this, key, value);
    });

    runOfflineEquipPercentileEnhancement();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastEquipmentPercentileFailure"))).toMatchObject({
      capability: "equipmentPercentile",
      stage: "persist-preference",
      detail: { error: "preference write blocked" },
    });
  });
});
