import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickSiteEvent, runQuickSiteAutomation } from "./quick-site.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({
    READ_FIELD: "readField",
  }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

beforeEach(() => {
  document.body.innerHTML = "";
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(null);
});

describe("quick site entry", () => {
  it("does not render when the option is disabled", () => {
    mocks.runOptionAutomation.mockReturnValue(false);

    expect(
      runQuickSiteAutomation({
        type: QuickSiteEvent.LOBBY_READY,
      })
    ).toBe(false);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "quickSite",
      fallback: false,
    });
    expect(document.querySelector(".quickSiteBar")).toBeNull();
  });

  it("renders default and configured links through the entry", () => {
    mocks.runOptionAutomation.mockReturnValue([
      { name: "Wiki", url: "https://example.test/wiki", fav: "" },
    ]);

    expect(
      runQuickSiteAutomation({
        type: QuickSiteEvent.LOBBY_READY,
      })
    ).toBe(true);

    expect(document.querySelector(".quickSiteBar")).not.toBeNull();
    expect(document.querySelector('[title="Wiki"] a')?.getAttribute("href")).toBe(
      "https://example.test/wiki"
    );
  });

  it("renders configured link fields as DOM values instead of raw HTML", () => {
    mocks.runOptionAutomation.mockReturnValue([
      {
        name: '<img src=x onerror="alert(1)">',
        url: "https://example.test/?a=<b>",
        fav: "https://example.test/icon.svg?x=<y>",
      },
    ]);

    runQuickSiteAutomation({
      type: QuickSiteEvent.LOBBY_READY,
    });

    const link = document.querySelector(".quickSiteBar span:last-child a");
    expect(link.textContent).toBe('<img src=x onerror="alert(1)">');
    expect(link.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.test/icon.svg?x=<y>"
    );
    expect(document.querySelector(".quickSiteBar span:last-child > img")).toBeNull();
  });

  it("toggles configured link visibility from the rendered control", () => {
    mocks.runOptionAutomation.mockReturnValue([
      { name: "Wiki", url: "https://example.test/wiki", fav: "" },
    ]);

    runQuickSiteAutomation({
      type: QuickSiteEvent.LOBBY_READY,
    });

    const toggle = document.querySelector(".quickSiteBarToggle");
    toggle.click();

    expect(document.querySelector('[title="Wiki"]').style.display).toBe("none");
    expect(toggle.textContent).toBe(">>");
  });

  it("renders settings rows through the quick site entry", () => {
    const html = runQuickSiteAutomation({
      type: QuickSiteEvent.RENDER_SETTINGS_TABLE_BODY,
      option: { quickSite: [{ name: 'Wiki "A"', url: "https://example.test/?a=<b>", fav: "&icon" }] },
    });

    expect(html).toContain("<l2>ICON</l2>");
    expect(html).toContain('value="Wiki &quot;A&quot;"');
    expect(html).toContain('value="https://example.test/?a=&lt;b&gt;"');
    expect(html).toContain('value="&amp;icon"');
  });

  it("renders current settings rows by reading quick site through the option entry", () => {
    mocks.runOptionAutomation.mockReturnValue([{ name: "Wiki", url: "https://example.test/wiki", fav: "" }]);

    const html = runQuickSiteAutomation({ type: QuickSiteEvent.RENDER_CURRENT_SETTINGS_TABLE_BODY });

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({ type: "readField", key: "quickSite", fallback: false });
    expect(html).toContain('value="Wiki"');
    expect(html).toContain('value="https://example.test/wiki"');
  });

  it("renders an empty settings table when quick site is disabled", () => {
    expect(
      runQuickSiteAutomation({ type: QuickSiteEvent.RENDER_SETTINGS_TABLE_BODY, option: { quickSite: false } })
    ).toBe("");
  });

  it("ignores unknown quick site events at the entry", () => {
    expect(runQuickSiteAutomation({ type: "unknown" })).toBe(false);
    expect(runQuickSiteAutomation(null)).toBe(false);
    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
    expect(document.querySelector(".quickSiteBar")).toBeNull();
  });

  it("renders settings empty row through the quick site entry", () => {
    expect(
      runQuickSiteAutomation({
        type: QuickSiteEvent.RENDER_SETTINGS_EMPTY_ROW,
      })
    ).toBe(
      '<td><input class="hvAADebug" type="text"></td><td><input class="hvAADebug" type="text"></td><td><input class="hvAADebug" type="text"></td>'
    );
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

  it("ignores incomplete settings rows without throwing", () => {
    const option = {};

    expect(() =>
      runQuickSiteAutomation({
        type: QuickSiteEvent.COLLECT_SETTINGS_INPUTS,
        option,
        inputs: [{ value: "https://example.test/icon.ico" }, { value: "Broken" }],
      })
    ).not.toThrow();

    expect(option.quickSite).toEqual([]);
  });
});
