import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadSubject() {
  vi.resetModules();
  return import("./equip-percentile-offline.js");
}

function equipmentMarkup() {
  return `
    <div>Legendary Rapier of Slaughter</div>
    <div class="eq">
      <div class="ex">
        <div title="Base: 95"><span>100 Attack Damage</span></div>
      </div>
    </div>
    <div class="eqt">Level 500</div>
  `;
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  localStorage.clear();
});

describe("offline equipment percentile popup lifecycle", () => {
  it("renders percentages when an already-visible Isekai equipment popup fills asynchronously", async () => {
    const popup = document.createElement("div");
    popup.id = "popup_box";
    popup.style.visibility = "visible";
    document.body.appendChild(popup);

    const { runOfflineEquipPercentileEnhancement } = await loadSubject();
    const dispose = runOfflineEquipPercentileEnhancement();

    popup.innerHTML = equipmentMarkup();

    await vi.waitFor(() => {
      expect(popup.querySelector(".hv-lpr-avg")?.textContent).toContain("优秀度:");
      expect(popup.querySelector('[title^="Base: "] span')?.textContent).toMatch(
        /% Attack Damage$/
      );
    });

    dispose();
  });
});
