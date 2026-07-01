import { describe, expect, it, vi } from "vitest";
import {
  CrossSiteEncounterEvent,
  runCrossSiteEncounterNavigation,
} from "./cross-site-encounter-navigation.js";
import { PageKind } from "./page-kind.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

function pageReady(kind) {
  return { type: CrossSiteEncounterEvent.PAGE_READY, kind };
}

describe("runCrossSiteEncounterNavigation", () => {
  it("records the current HV origin through the event entry", () => {
    const setValue = vi.fn();

    expect(
      runCrossSiteEncounterNavigation(pageReady(PageKind.LOBBY), {
        origin: () => "https://alt.hentaiverse.org",
        setValue,
      })
    ).toBe(false);

    expect(setValue).toHaveBeenCalledWith(STORAGE_KEYS.URL, "https://alt.hentaiverse.org");
  });

  it("redirects an e-hentai encounter page back to the stored HV origin", () => {
    const openUrl = vi.fn();
    const document = window.document.implementation.createHTMLDocument("");
    document.body.innerHTML = '<div id="eventpane"><div><a href="https://e-hentai.org/encounter.php">fight</a></div></div>';

    expect(
      runCrossSiteEncounterNavigation(pageReady(PageKind.EHENTAI), {
        document: () => document,
        getValue: () => "https://hentaiverse.org",
        href: () => "https://e-hentai.org/news.php?encounter",
        openUrl,
        referrer: () => "",
      })
    ).toBe(true);

    expect(openUrl).toHaveBeenCalledWith(
      "https://hentaiverse.org/encounter.php",
      "crossSiteEncounter"
    );
  });

  it("uses HV referrer as fallback return origin without navigating non-encounter e-hentai pages", () => {
    const openUrl = vi.fn();

    expect(
      runCrossSiteEncounterNavigation(pageReady(PageKind.EHENTAI), {
        getValue: () => "",
        href: () => "https://e-hentai.org/news.php",
        openUrl,
        referrer: () => "https://alt.hentaiverse.org/?s=Battle",
      })
    ).toBe(true);

    expect(openUrl).not.toHaveBeenCalled();
  });
});
