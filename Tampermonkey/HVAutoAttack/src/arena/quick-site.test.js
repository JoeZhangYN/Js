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

  it("renders settings rows through the quick site entry", () => {
    const html = runQuickSiteAutomation({
      type: QuickSiteEvent.RENDER_SETTINGS_TABLE_BODY,
      option: {
        quickSite: [{ name: 'Wiki "A"', url: "https://example.test/?a=<b>", fav: "&icon" }],
      },
    });

    expect(html).toContain("<l2>ICON</l2>");
    expect(html).toContain('value="Wiki &quot;A&quot;"');
    expect(html).toContain('value="https://example.test/?a=&lt;b&gt;"');
    expect(html).toContain('value="&amp;icon"');
  });

  it("renders an empty settings table when quick site is disabled", () => {
    expect(
      runQuickSiteAutomation({
        type: QuickSiteEvent.RENDER_SETTINGS_TABLE_BODY,
        option: { quickSite: false },
      })
    ).toBe("");
  });

  it("collects settings inputs through the quick site entry", () => {
    const inputs = [
      { value: "https://example.test/favicon.ico" },
      { value: "Wiki" },
      { value: "https://example.test/wiki" },
      { value: "" },
      { value: "" },
      { value: "https://example.test/ignored" },
    ];
    const option = {};

    expect(
      runQuickSiteAutomation({
        type: QuickSiteEvent.COLLECT_SETTINGS_INPUTS,
        option,
        inputs,
      })
    ).toBe(option);
    expect(option.quickSite).toEqual([
      {
        fav: "https://example.test/favicon.ico",
        name: "Wiki",
        url: "https://example.test/wiki",
      },
    ]);
  });
});
