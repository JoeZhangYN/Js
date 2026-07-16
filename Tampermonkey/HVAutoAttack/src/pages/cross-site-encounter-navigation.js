// 跨站遭遇入口导航：维护 HV origin，并在 e-hentai encounter 页回跳 HV。
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  NavigationEvent,
  NavigationRedirectReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";
import {
  classifyEncounterGenerationResult,
  EncounterGenerationResultStatus,
} from "./encounter-generation-result.js";
import { PageKind } from "./page-kind.js";
import {
  persistCrossSiteReturnOrigin,
  recordCrossSiteEncounterFailure,
} from "./cross-site-encounter-failure.js";

const DEFAULT_HV_ORIGIN = "https://hentaiverse.org";
const EHENTAI_ENCOUNTER_URL = "https://e-hentai.org/news.php?encounter";
const EVENT_PAGE_READY = "pageReady";

export const CrossSiteEncounterEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

function readReturnOrigin(deps) {
  const storedOrigin = deps.getValue(STORAGE_KEYS.URL);
  if (storedOrigin) return storedOrigin;
  const referrer = deps.referrer();
  if (referrer.includes("hentaiverse.org")) {
    return new URL(referrer).origin;
  }
  return DEFAULT_HV_ORIGIN;
}

function blockUnavailableEncounter(deps, eventpane, eventpanePresent, result) {
  const source = {
    identity: "persistentEncounterGeneration",
    pageKind: PageKind.EHENTAI,
    href: deps.href(),
  };
  const request = { method: "GET", url: EHENTAI_ENCOUNTER_URL };
  deps.recordFailure("generation-result-unavailable", {
    kind: "encounterGenerationUnavailable",
    source,
    request,
    result,
  });
  const generation = deps.handleGenerationPage({
    eventpane,
    eventpanePresent,
    request,
    source,
  });
  return Boolean(generation?.handled);
}

function redirectToEncounterOrigin(deps) {
  if (deps.href() !== EHENTAI_ENCOUNTER_URL) return true;
  const eventpaneNode = deps.document().querySelector("#eventpane");
  const eventpane = eventpaneNode?.innerHTML || "";
  const eventpanePresent = Boolean(eventpaneNode);
  const result = classifyEncounterGenerationResult({ eventpane, eventpanePresent });
  if (result.status !== EncounterGenerationResultStatus.AVAILABLE) {
    return blockUnavailableEncounter(deps, eventpane, eventpanePresent, result);
  }
  return Boolean(
    deps.openUrl(
      `${readReturnOrigin(deps)}/?s=Battle&ss=ba&encounter=${result.key}`,
      NavigationRedirectReason.CROSS_SITE_ENCOUNTER
    )
  );
}

function makeDeps(deps) {
  return {
    document: deps.document || (() => document),
    getValue: deps.getValue || getValue,
    href: deps.href || (() => window.location.href),
    openUrl:
      deps.openUrl ||
      ((url, reason) =>
        runNavigationAutomation({
          type: NavigationEvent.OPEN_URL,
          reason,
          url,
        })),
    origin: deps.origin || (() => window.location.origin),
    referrer: deps.referrer || (() => document.referrer),
    persistReturnOrigin: deps.persistReturnOrigin || persistCrossSiteReturnOrigin,
    recordFailure: deps.recordFailure || recordCrossSiteEncounterFailure,
    handleGenerationPage:
      deps.handleGenerationPage ||
      ((event) =>
        runEncounterAutomation({
          type: EncounterEvent.GENERATION_PAGE_READY,
          ...event,
        })),
  };
}

export function runCrossSiteEncounterNavigation(event = { type: EVENT_PAGE_READY }, deps = {}) {
  if (event?.type !== EVENT_PAGE_READY) return false;
  const runtime = makeDeps(deps);
  const { kind } = event;
  if (kind === PageKind.EHENTAI) {
    return redirectToEncounterOrigin(runtime);
  }
  runtime.persistReturnOrigin(runtime.origin());
  return false;
}
