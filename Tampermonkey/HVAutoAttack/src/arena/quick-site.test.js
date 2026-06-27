import { beforeEach, describe, expect, it } from "vitest";
import { QuickSiteEvent, runQuickSiteAutomation } from "./quick-site.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("quick site entry", () => {
  it("does not render when the option is disabled", () => {
    expect(
      runQuickSiteAutomation({
        type: QuickSiteEvent.LOBBY_READY,
        option: { quickSite: false },
      })
    ).toBe(false);

    expect(document.querySelector(".quickSiteBar")).toBeNull();
  });

  it("renders default and configured links through the entry", () => {
    expect(
      runQuickSiteAutomation({
        type: QuickSiteEvent.LOBBY_READY,
        option: {
          quickSite: [{ name: "Wiki", url: "https://example.test/wiki", fav: "" }],
        },
      })
    ).toBe(true);

    expect(document.querySelector(".quickSiteBar")).not.toBeNull();
    expect(document.querySelector('[title="Wiki"] a')?.getAttribute("href")).toBe(
      "https://example.test/wiki"
    );
  });

  it("toggles configured link visibility from the rendered control", () => {
    runQuickSiteAutomation({
      type: QuickSiteEvent.LOBBY_READY,
      option: {
        quickSite: [{ name: "Wiki", url: "https://example.test/wiki", fav: "" }],
      },
    });

    const toggle = document.querySelector(".quickSiteBarToggle");
    toggle.click();

    expect(document.querySelector('[title="Wiki"]').style.display).toBe("none");
    expect(toggle.textContent).toBe(">>");
  });
});
