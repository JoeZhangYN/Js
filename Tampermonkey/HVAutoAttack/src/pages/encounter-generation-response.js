const MAX_TITLE_LENGTH = 160;

export const EncounterGenerationResponseIdentity = Object.freeze({
  EVENT_SURFACE: "eventSurface",
  NEWS_PAGE: "newsPage",
  UNRECOGNIZED_PAGE: "unrecognizedPage",
});

function routeEvidence(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return {
      origin: url.origin,
      pathname: url.pathname,
      hasQuery: Boolean(url.search),
    };
  } catch {
    return { invalid: true };
  }
}

function sameRoute(left, right) {
  return Boolean(
    left &&
    right &&
    !left.invalid &&
    !right.invalid &&
    left.origin === right.origin &&
    left.pathname === right.pathname
  );
}

export function readEncounterGenerationResponse(event, deps = { DOMParser }) {
  const html = String(event.html || "");
  const doc = new deps.DOMParser().parseFromString(html, "text/html");
  const eventpaneNode = doc.querySelector("#eventpane");
  const newsOuterPresent = Boolean(doc.querySelector("#newsouter"));
  const newsInnerPresent = Boolean(doc.querySelector("#newsinner"));
  const requestedRoute = routeEvidence(event.requestedUrl);
  const finalRoute = routeEvidence(event.finalUrl || event.requestedUrl);
  const newsPagePresent =
    newsOuterPresent && newsInnerPresent && sameRoute(requestedRoute, finalRoute);
  const kind = eventpaneNode
    ? EncounterGenerationResponseIdentity.EVENT_SURFACE
    : newsPagePresent
      ? EncounterGenerationResponseIdentity.NEWS_PAGE
      : EncounterGenerationResponseIdentity.UNRECOGNIZED_PAGE;
  return {
    eventpane: eventpaneNode?.innerHTML || "",
    eventpanePresent: Boolean(eventpaneNode),
    newsPagePresent,
    responseIdentity: {
      kind,
      status: Number(event.status) || 0,
      requestedRoute,
      finalRoute,
      title: String(doc.title || "")
        .trim()
        .slice(0, MAX_TITLE_LENGTH),
      contentLength: html.length,
      markers: {
        eventpane: Boolean(eventpaneNode),
        newsOuter: newsOuterPresent,
        newsInner: newsInnerPresent,
        battle: Boolean(doc.querySelector("#battle_top")),
      },
    },
  };
}
