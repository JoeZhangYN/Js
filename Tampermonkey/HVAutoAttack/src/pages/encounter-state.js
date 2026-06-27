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
const EVENT_READ_CURRENT = "readCurrent";
const EVENT_MARK_STARTED = "markStarted";
const EVENT_LOAD_KEY = "loadKey";

export const EncounterStateEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
  MARK_STARTED: EVENT_MARK_STARTED,
  LOAD_KEY: EVENT_LOAD_KEY,
});

function readRawReState() {
  if (typeof GM_getValue !== "undefined") {
    return GM_getValue(HVUT_RE_KEY, defaultEncounterState());
  }
  const raw = localStorage.getItem(HVUT_RE_KEY);
  return raw ? JSON.parse(raw) : defaultEncounterState();
}

function writeReState(state) {
  if (typeof GM_setValue !== "undefined") {
    GM_setValue(HVUT_RE_KEY, state);
    return;
  }
  localStorage.setItem(HVUT_RE_KEY, JSON.stringify(state));
}

function readCurrentReState() {
  const state = normalizeEncounterState(readRawReState());
  writeReState(state);
  return state;
}

function markRandomEncounterStarted(search = window.location.search) {
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

function loadEncounterKey() {
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

export function runEncounterStateAutomation(event = { type: EVENT_READ_CURRENT }) {
  if (event.type === EVENT_READ_CURRENT) return readCurrentReState();
  if (event.type === EVENT_MARK_STARTED) {
    markRandomEncounterStarted(event.search);
    return undefined;
  }
  if (event.type === EVENT_LOAD_KEY) return loadEncounterKey();
  return undefined;
}
