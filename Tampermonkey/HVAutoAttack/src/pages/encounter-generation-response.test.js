import { describe, expect, it } from "vitest";
import {
  EncounterGenerationResponseIdentity,
  readEncounterGenerationResponse,
} from "./encounter-generation-response.js";

const REQUEST_URL = "https://e-hentai.org/news.php";

describe("encounter generation response identity", () => {
  it("recognizes the canonical news page without treating a missing event pane as page drift", () => {
    expect(
      readEncounterGenerationResponse({
        html: '<html><head><title>E-Hentai Galleries</title></head><body><div id="newsouter"><div id="newsinner">News</div></div></body></html>',
        status: 200,
        requestedUrl: REQUEST_URL,
        finalUrl: REQUEST_URL,
      })
    ).toMatchObject({
      eventpanePresent: false,
      newsPagePresent: true,
      responseIdentity: {
        kind: EncounterGenerationResponseIdentity.NEWS_PAGE,
        status: 200,
        requestedRoute: {
          origin: "https://e-hentai.org",
          pathname: "/news.php",
          hasQuery: false,
        },
        finalRoute: {
          origin: "https://e-hentai.org",
          pathname: "/news.php",
          hasQuery: false,
        },
        title: "E-Hentai Galleries",
        markers: { eventpane: false, newsOuter: true, newsInner: true, battle: false },
      },
    });
  });

  it("preserves the event surface and encounter link as the authoritative response identity", () => {
    expect(
      readEncounterGenerationResponse({
        html: '<div id="eventpane"><a href="?s=Battle&amp;ss=ba&amp;encounter=abc=">RE</a></div>',
        status: 200,
        requestedUrl: REQUEST_URL,
        finalUrl: REQUEST_URL,
      })
    ).toMatchObject({
      eventpanePresent: true,
      eventpane: expect.stringContaining("encounter=abc="),
      responseIdentity: {
        kind: EncounterGenerationResponseIdentity.EVENT_SURFACE,
        status: 200,
      },
    });
  });

  it("classifies redirects or unrelated HTML as unrecognized without persisting response bodies", () => {
    const result = readEncounterGenerationResponse({
      html: '<html><head><title>Sign in</title></head><body><form id="login"></form></body></html>',
      status: 200,
      requestedUrl: REQUEST_URL,
      finalUrl: "https://forums.e-hentai.org/index.php?act=Login&token=secret",
    });

    expect(result).toMatchObject({
      eventpanePresent: false,
      newsPagePresent: false,
      responseIdentity: {
        kind: EncounterGenerationResponseIdentity.UNRECOGNIZED_PAGE,
        finalRoute: { origin: "https://forums.e-hentai.org", pathname: "/index.php" },
        title: "Sign in",
      },
    });
    expect(JSON.stringify(result)).not.toContain("token=secret");
    expect(JSON.stringify(result)).not.toContain("<form");
  });
});
