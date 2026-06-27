// 跨站遭遇入口导航：维护 HV origin，并在 e-hentai encounter 页回跳 HV。
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { openUrl } from "../core/navigate.js";
import { PageKind } from "./page-kind.js";

const DEFAULT_HV_ORIGIN = "https://hentaiverse.org";
const EHENTAI_ENCOUNTER_URL = "https://e-hentai.org/news.php?encounter";

function readReturnOrigin() {
  if (getValue(STORAGE_KEYS.URL)) return getValue(STORAGE_KEYS.URL);
  if (document.referrer.includes("hentaiverse.org")) {
    return new URL(document.referrer).origin;
  }
  return DEFAULT_HV_ORIGIN;
}

function readEncounterPath() {
  const eventLink = document.querySelector("#eventpane>div>a");
  return eventLink ? `/${eventLink.href.split("/")[3]}` : "";
}

function redirectToEncounterOrigin() {
  if (window.location.href !== EHENTAI_ENCOUNTER_URL) return;
  openUrl(`${readReturnOrigin()}${readEncounterPath()}`);
}

export function runCrossSiteEncounterNavigation(kind) {
  if (kind === PageKind.EHENTAI) {
    redirectToEncounterOrigin();
    return true;
  }
  setValue(STORAGE_KEYS.URL, window.location.origin);
  return false;
}
