import { gmXhr } from "../dom/gm-xhr.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const HVUT_RE_KEY = "hvut_re";
const EVENT_READ_CURRENT = "readCurrent";
const EVENT_MARK_STARTED = "markStarted";
const EVENT_MARK_ATTEMPTED = "markAttempted";
const EVENT_LOAD_KEY = "loadKey";

export const EncounterStateEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
  MARK_STARTED: EVENT_MARK_STARTED,
  MARK_ATTEMPTED: EVENT_MARK_ATTEMPTED,
  LOAD_KEY: EVENT_LOAD_KEY,
});

function defaultReState() {
  return runEncounterPolicy({ type: EncounterPolicyEvent.DEFAULT_STATE });
}

function warnEncounterStateFailure(stage, detail) {
  console.warn("[HVAA] encounter state failed", { stage, detail });
}

function parseStoredReState(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    warnEncounterStateFailure("read-local-json", { key: HVUT_RE_KEY, error: error.message });
    return defaultReState();
  }
}

function readRawReState() {
  if (typeof GM_getValue !== "undefined") {
    try {
      return GM_getValue(HVUT_RE_KEY, defaultReState());
    } catch (error) {
      warnEncounterStateFailure("read-gm", { key: HVUT_RE_KEY, error: error.message });
    }
  }
  try {
    const raw = localStorage.getItem(HVUT_RE_KEY);
    return raw ? parseStoredReState(raw) : defaultReState();
  } catch (error) {
    warnEncounterStateFailure("read-local", { key: HVUT_RE_KEY, error: error.message });
    return defaultReState();
  }
}

function writeReState(state) {
  if (typeof GM_setValue !== "undefined") {
    try {
      GM_setValue(HVUT_RE_KEY, state);
      return true;
    } catch (error) {
      warnEncounterStateFailure("write-gm", { key: HVUT_RE_KEY, state, error: error.message });
    }
  }
  try {
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    warnEncounterStateFailure("write-local", { key: HVUT_RE_KEY, state, error: error.message });
    return false;
  }
}

function readCurrentReState() {
  const state = runEncounterPolicy({
    type: EncounterPolicyEvent.NORMALIZE,
    state: readRawReState(),
  });
  writeReState(state);
  return state;
}

function markRandomEncounterStarted(search = window.location.search) {
  writeReState(
    runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_STARTED,
      state: readCurrentReState(),
      search,
    })
  );
}

function markEncounterAttempted(key, state) {
  writeReState(
    runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_ATTEMPTED,
      state: state || readCurrentReState(),
      key,
    })
  );
  return readCurrentReState();
}

function parseEncounterKey(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const eventpane = doc.querySelector("#eventpane")?.innerHTML || "";
  return {
    key: runEncounterPolicy({
      type: EncounterPolicyEvent.PARSE_EVENTPANE_KEY,
      eventpane,
    }),
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
          writeReState(
            runEncounterPolicy({
              type: EncounterPolicyEvent.MARK_KEY_AVAILABLE,
              state,
              key: parsed.key,
            })
          );
        } else if (parsed.dawn) {
          writeReState(runEncounterPolicy({ type: EncounterPolicyEvent.RESET_DAY }));
        }
        resolve(parsed.key ? readCurrentReState() : null);
      },
      onerror: (failure) => {
        warnEncounterStateFailure("load-key-error", failure);
        resolve(null);
      },
      ontimeout: () => {
        warnEncounterStateFailure("load-key-timeout", { url: "https://e-hentai.org/news.php" });
        resolve(null);
      },
    });
  });
}

const encounterStateEventHandlers = Object.freeze({
  [EVENT_READ_CURRENT]: () => readCurrentReState(),
  [EVENT_MARK_STARTED]: (event) => {
    markRandomEncounterStarted(event.search);
    return undefined;
  },
  [EVENT_MARK_ATTEMPTED]: (event) => markEncounterAttempted(event.key, event.state),
  [EVENT_LOAD_KEY]: () => loadEncounterKey(),
});

export function runEncounterStateAutomation(event = { type: EVENT_READ_CURRENT }) {
  return encounterStateEventHandlers[event?.type]?.(event);
}
