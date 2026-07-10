import { describe, expect, it, vi } from "vitest";
import {
  CrossSiteEncounterEvent,
  runCrossSiteEncounterNavigation,
} from "./cross-site-encounter-navigation.js";
import { PageKind } from "./page-kind.js";

describe("cross-site encounter identity", () => {
  it("blocks a non-encounter anchor instead of redirecting it to the bare HV origin", () => {
    const openUrl = vi.fn();
    const recordFailure = vi.fn();
    const handleGenerationPage = vi.fn(() => ({ handled: true, blocked: true }));
    const document = window.document.implementation.createHTMLDocument("");
    document.body.innerHTML =
      '<div id="eventpane"><div><a href="https://e-hentai.org/">news</a></div></div>';

    expect(
      runCrossSiteEncounterNavigation(
        { type: CrossSiteEncounterEvent.PAGE_READY, kind: PageKind.EHENTAI },
        {
          document: () => document,
          getValue: () => "https://hentaiverse.org",
          href: () => "https://e-hentai.org/news.php?encounter",
          openUrl,
          recordFailure,
          handleGenerationPage,
        }
      )
    ).toBe(true);

    expect(openUrl).not.toHaveBeenCalled();
    expect(recordFailure).toHaveBeenCalledWith(
      "generation-result-unavailable",
      expect.objectContaining({
        result: { status: "unavailable", reason: "encounterKeyMissing" },
      })
    );
    expect(handleGenerationPage).toHaveBeenCalledOnce();
  });
});
