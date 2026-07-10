import { describe, expect, it } from "vitest";
import { GameWorld, SiteIdentity } from "../core/ingress-identity.js";
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
    ).toMatchObject({
      kind: PageKind.EHENTAI,
      site: SiteIdentity.EXTERNAL,
      world: GameWorld.PERSISTENT,
    });
  });

  it("detects game page kinds from the ordered sentinel contract", () => {
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="riddlecounter"></div>'),
        location: locationWith(),
      })
    ).toMatchObject({ kind: PageKind.RIDDLE, site: SiteIdentity.HV, world: GameWorld.PERSISTENT });
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="textlog"></div>'),
        location: locationWith(),
      })
    ).toMatchObject({ kind: PageKind.BATTLE, site: SiteIdentity.HV, world: GameWorld.PERSISTENT });
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="navbar"></div>'),
        location: locationWith(),
      })
    ).toMatchObject({ kind: PageKind.LOBBY, site: SiteIdentity.HV, world: GameWorld.PERSISTENT });
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith('<div id="navbar"></div>'),
        location: locationWith({ pathname: "/isekai/" }),
      })
    ).toMatchObject({
      kind: PageKind.ISEKAI_LOBBY,
      site: SiteIdentity.HV,
      world: GameWorld.ISEKAI,
    });
  });

  it("detects equipment pages and unknown pages", () => {
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith("<div></div>"),
        location: locationWith({ pathname: "/equip/123" }),
      })
    ).toMatchObject({
      kind: PageKind.SHOWEQUIP,
      site: SiteIdentity.HV,
      world: GameWorld.PERSISTENT,
    });
    expect(
      runPageKindAutomation({
        type: PageKindEvent.DETECT_CURRENT,
        document: docWith("<div></div>"),
        location: locationWith(),
      })
    ).toMatchObject({ kind: PageKind.UNKNOWN, site: SiteIdentity.HV, world: GameWorld.PERSISTENT });
  });

  it("rejects unknown and null page kind events without detecting a page", () => {
    expect(runPageKindAutomation({ type: "unknown" })).toBeUndefined();
    expect(runPageKindAutomation(null)).toBeUndefined();
  });
});
