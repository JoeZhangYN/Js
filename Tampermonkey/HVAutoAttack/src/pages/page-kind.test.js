import { describe, expect, it } from "vitest";
import { PageKind, PageKindEvent, runPageKindAutomation } from "./page-kind.js";

function docWith(html) {
  const doc = document.implementation.createHTMLDocument("");
  doc.body.innerHTML = html;
  return doc;
}

function locationWith({ host = "hentaiverse.org", pathname = "/" } = {}) {
  return { host, pathname };
}

describe("runPageKindAutomation", () => {
  it("detects e-hentai before DOM sentinels", () => {
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="navbar"></div>'),
        location: locationWith({ host: "e-hentai.org" }),
      })
    ).toBe(PageKind.EHENTAI);
  });

  it("detects game page kinds from the ordered sentinel contract", () => {
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="riddlecounter"></div>'),
        location: locationWith(),
      })
    ).toBe(PageKind.RIDDLE);
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="textlog"></div>'),
        location: locationWith(),
      })
    ).toBe(PageKind.BATTLE);
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="navbar"></div>'),
        location: locationWith(),
      })
    ).toBe(PageKind.LOBBY);
  });

  it("detects equipment pages and unknown pages", () => {
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith("<div></div>"),
        location: locationWith({ pathname: "/equip/123" }),
      })
    ).toBe(PageKind.SHOWEQUIP);
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith("<div></div>"),
        location: locationWith(),
      })
    ).toBe(PageKind.UNKNOWN);
  });

  it("ignores unknown page kind events", () => {
    expect(runPageKindAutomation({ type: "unknown" })).toBeUndefined();
  });
});
