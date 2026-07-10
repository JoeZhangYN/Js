import { describe, expect, it, vi } from "vitest";
import {
  CrossSiteEncounterEvent,
  runCrossSiteEncounterNavigation,
} from "./cross-site-encounter-navigation.js";
import { PageKind } from "./page-kind.js";

function pageReady(kind) {
  return { type: CrossSiteEncounterEvent.PAGE_READY, kind };
}

describe("runCrossSiteEncounterNavigation", () => {
  it("rejects unknown and null events without storing or navigating", () => {
    const openUrl = vi.fn();
    const setValue = vi.fn();

    expect(runCrossSiteEncounterNavigation({ type: "unknown" }, { openUrl, setValue })).toBe(false);
    expect(runCrossSiteEncounterNavigation(null, { openUrl, setValue })).toBe(false);

    expect(openUrl).not.toHaveBeenCalled();
    expect(setValue).not.toHaveBeenCalled();
  });

  it("records the current HV origin through the event entry", () => {
    const persistReturnOrigin = vi.fn(() => true);

    expect(
      runCrossSiteEncounterNavigation(pageReady(PageKind.LOBBY), {
        origin: () => "https://alt.hentaiverse.org",
        persistReturnOrigin,
      })
    ).toBe(false);

    expect(persistReturnOrigin).toHaveBeenCalledWith("https://alt.hentaiverse.org");
  });

  it("redirects an e-hentai encounter page back to the stored HV origin", () => {
    const openUrl = vi.fn(() => true);
    const document = window.document.implementation.createHTMLDocument("");
    document.body.innerHTML =
      '<div id="eventpane"><div><a href="?s=Battle&amp;ss=ba&amp;encounter=abc=">fight</a></div></div>';

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
      "https://hentaiverse.org/?s=Battle&ss=ba&encounter=abc=",
      "crossSiteEncounter"
    );
  });

  it("does not report encounter redirect success when URL navigation is blocked", () => {
    const openUrl = vi.fn(() => false);
    const document = window.document.implementation.createHTMLDocument("");
    document.body.innerHTML =
      '<div id="eventpane"><div><a href="?s=Battle&amp;ss=ba&amp;encounter=abc=">fight</a></div></div>';

    expect(
      runCrossSiteEncounterNavigation(pageReady(PageKind.EHENTAI), {
        document: () => document,
        getValue: () => "https://hentaiverse.org",
        href: () => "https://e-hentai.org/news.php?encounter",
        openUrl,
        referrer: () => "",
      })
    ).toBe(false);

    expect(openUrl).toHaveBeenCalledWith(
      "https://hentaiverse.org/?s=Battle&ss=ba&encounter=abc=",
      "crossSiteEncounter"
    );
  });

  it("blocks an encounter generation page with no route instead of redirecting to bare HV", () => {
    const openUrl = vi.fn();
    const recordFailure = vi.fn();
    const handleGenerationPage = vi.fn(() => ({
      action: "blocked",
      handled: true,
      generation: { reason: "dailyResetEvent" },
    }));
    const document = window.document.implementation.createHTMLDocument("");
    document.body.innerHTML = '<div id="eventpane">It is the dawn of a new day!</div>';

    expect(
      runCrossSiteEncounterNavigation(pageReady(PageKind.EHENTAI), {
        document: () => document,
        getValue: () => "https://hentaiverse.org",
        href: () => "https://e-hentai.org/news.php?encounter",
        openUrl,
        recordFailure,
        handleGenerationPage,
      })
    ).toBe(true);

    expect(openUrl).not.toHaveBeenCalled();
    expect(handleGenerationPage).toHaveBeenCalledWith(
      expect.objectContaining({
        eventpane: "It is the dawn of a new day!",
        source: expect.objectContaining({ identity: "persistentEncounterGeneration" }),
      })
    );
    expect(recordFailure).toHaveBeenCalledWith(
      "generation-result-unavailable",
      expect.objectContaining({
        kind: "encounterGenerationUnavailable",
        request: { method: "GET", url: "https://e-hentai.org/news.php?encounter" },
      })
    );
    expect(recordFailure.mock.invocationCallOrder[0]).toBeLessThan(
      handleGenerationPage.mock.invocationCallOrder[0]
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
