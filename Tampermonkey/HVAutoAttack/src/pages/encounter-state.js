import { gmXhr } from "../dom/gm-xhr.js";
import { time } from "../core/time.js";

export const ENCOUNTER_INTERVAL_MS = 30 * 60 * 1000;
const HVUT_RE_KEY = "hvut_re";

function readRawReState() {
  if (typeof GM_getValue !== "undefined") {
    return GM_getValue(HVUT_RE_KEY, { date: 0, key: "", count: 0, clear: true });
  }
  const raw = localStorage.getItem(HVUT_RE_KEY);
  return raw ? JSON.parse(raw) : { date: 0, key: "", count: 0, clear: true };
}

export function writeReState(state) {
  if (typeof GM_setValue !== "undefined") {
    GM_setValue(HVUT_RE_KEY, state);
    return;
  }
  localStorage.setItem(HVUT_RE_KEY, JSON.stringify(state));
}

function normalizeReState(state, now = new Date()) {
  const normalized = {
    date: Number(state?.date) || 0,
    key: state?.key || "",
    count: Number(state?.count) || 0,
    clear: state?.clear !== false,
  };
  const date = new Date(normalized.date);
  if (
    normalized.date &&
    (date.getUTCDate() !== now.getUTCDate() ||
      date.getUTCMonth() !== now.getUTCMonth() ||
      date.getUTCFullYear() !== now.getUTCFullYear())
  ) {
    return { date: now.getTime(), key: "", count: 0, clear: true };
  }
  return normalized;
}

export function readCurrentReState() {
  const state = normalizeReState(readRawReState());
  writeReState(state);
  return state;
}

export function markRandomEncounterStarted(search = window.location.search) {
  const key = /\?s=Battle&ss=ba&encounter=([A-Za-z0-9=]+)/.exec(search)?.[1];
  const state = readCurrentReState();
  const now = time(0);
  if (key && state.key === key) {
    state.clear = true;
  } else if (!key || state.date + ENCOUNTER_INTERVAL_MS < now) {
    state.date = now;
    state.key = key || state.key || "";
    state.count++;
    state.clear = true;
  }
  writeReState(state);
}

export function msUntilReady(state, now = time(0)) {
  return Math.max(0, state.date + ENCOUNTER_INTERVAL_MS - now);
}

function parseEncounterKey(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const eventpane = doc.querySelector("#eventpane")?.innerHTML || "";
  return {
    key: eventpane.match(/\?s=Battle&amp;ss=ba&amp;encounter=([A-Za-z0-9=]+)/)?.[1],
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
          state.date = time(0);
          state.key = parsed.key;
          state.count++;
          state.clear = false;
          writeReState(state);
        } else if (parsed.dawn) {
          writeReState({ date: time(0), key: "", count: 0, clear: true });
        }
        resolve(parsed.key ? readCurrentReState() : null);
      },
      onerror: () => resolve(null),
      ontimeout: () => resolve(null),
    });
  });
}
