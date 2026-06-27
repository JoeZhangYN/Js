import { gmXhr } from "../dom/gm-xhr.js";
import {
  defaultEncounterState,
  markEncounterKeyAvailable,
  markEncounterStarted,
  normalizeEncounterState,
  parseEncounterKeyFromEventpaneHtml,
  resetEncounterDay,
} from "./encounter-policy.js";

const HVUT_RE_KEY = "hvut_re";

function readRawReState() {
  if (typeof GM_getValue !== "undefined") {
    return GM_getValue(HVUT_RE_KEY, defaultEncounterState());
  }
  const raw = localStorage.getItem(HVUT_RE_KEY);
  return raw ? JSON.parse(raw) : defaultEncounterState();
}

export function writeReState(state) {
  if (typeof GM_setValue !== "undefined") {
    GM_setValue(HVUT_RE_KEY, state);
    return;
  }
  localStorage.setItem(HVUT_RE_KEY, JSON.stringify(state));
}

export function readCurrentReState() {
  const state = normalizeEncounterState(readRawReState());
  writeReState(state);
  return state;
}

export function markRandomEncounterStarted(search = window.location.search) {
  writeReState(markEncounterStarted(readCurrentReState(), { search }));
}

function parseEncounterKey(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const eventpane = doc.querySelector("#eventpane")?.innerHTML || "";
  return {
    key: parseEncounterKeyFromEventpaneHtml(eventpane),
    dawn: eventpane.includes("It is the dawn of a new day"),
  };
}

export function loadEncounterKey() {
  return new Promise((resolve) => {
    gmXhr({
      method: "GET",
      url: "https://e-hentai.org/news.php",
      responseType: "text",
      onload: (resp) => {
        const parsed = parseEncounterKey(resp.responseText || resp.response || "");
        const state = readCurrentReState();
        if (parsed.key) {
          writeReState(markEncounterKeyAvailable(state, parsed.key));
        } else if (parsed.dawn) {
          writeReState(resetEncounterDay());
        }
        resolve(parsed.key ? readCurrentReState() : null);
      },
      onerror: () => resolve(null),
      ontimeout: () => resolve(null),
    });
  });
}
