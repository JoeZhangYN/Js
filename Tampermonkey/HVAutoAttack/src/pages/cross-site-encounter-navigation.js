// 跨站遭遇入口导航：维护 HV origin，并在 e-hentai encounter 页回跳 HV。
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  NavigationEvent,
  NavigationRedirectReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { PageKind } from "./page-kind.js";

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

function readEncounterPath(deps) {
  const eventLink = deps.document().querySelector("#eventpane>div>a");
  return eventLink ? `/${eventLink.href.split("/")[3]}` : "";
}

function redirectToEncounterOrigin(deps) {
  if (deps.href() !== EHENTAI_ENCOUNTER_URL) return;
  deps.openUrl(`${readReturnOrigin(deps)}${readEncounterPath(deps)}`, NavigationRedirectReason.CROSS_SITE_ENCOUNTER);
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
    setValue: deps.setValue || setValue,
  };
}

export function runCrossSiteEncounterNavigation(event = { type: EVENT_PAGE_READY }, deps = {}) {
  if (event?.type !== EVENT_PAGE_READY) return false;
  const runtime = makeDeps(deps);
  const { kind } = event;
  if (kind === PageKind.EHENTAI) {
    redirectToEncounterOrigin(runtime);
    return true;
  }
  runtime.setValue(STORAGE_KEYS.URL, runtime.origin());
  return false;
}
