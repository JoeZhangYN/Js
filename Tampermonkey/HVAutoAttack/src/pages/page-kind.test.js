import { describe, expect, it } from "vitest";
import { PageKind, PageKindEvent, PageWorld, runPageKindAutomation } from "./page-kind.js";

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
    ).toMatchObject({ kind: PageKind.EHENTAI, world: PageWorld.EXTERNAL, isIsekai: false });
  });

  it("detects game page kinds from the ordered sentinel contract", () => {
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="riddlecounter"></div>'),
        location: locationWith(),
      })
    ).toMatchObject({ kind: PageKind.RIDDLE, world: PageWorld.PERSISTENT, isIsekai: false });
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="textlog"></div>'),
        location: locationWith(),
      })
    ).toMatchObject({ kind: PageKind.BATTLE, world: PageWorld.PERSISTENT, isIsekai: false });
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="navbar"></div>'),
        location: locationWith(),
      })
    ).toMatchObject({ kind: PageKind.LOBBY, world: PageWorld.PERSISTENT, isIsekai: false });
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="navbar"></div>'),
        location: locationWith({ pathname: "/isekai/" }),
      })
    ).toMatchObject({ kind: PageKind.ISEKAI_LOBBY, world: PageWorld.ISEKAI, isIsekai: true });
  });

  it("detects equipment pages and unknown pages", () => {
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith("<div></div>"),
        location: locationWith({ pathname: "/equip/123" }),
      })
    ).toMatchObject({ kind: PageKind.SHOWEQUIP, world: PageWorld.PERSISTENT, isIsekai: false });
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith("<div></div>"),
        location: locationWith(),
      })
    ).toMatchObject({ kind: PageKind.UNKNOWN, world: PageWorld.PERSISTENT, isIsekai: false });
  });

  it("rejects unknown and null page kind events without detecting a page", () => {
    expect(runPageKindAutomation({ type: "unknown" })).toBeUndefined();
    expect(runPageKindAutomation(null)).toBeUndefined();
  });
});
