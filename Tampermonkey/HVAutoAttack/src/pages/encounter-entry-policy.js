const ENCOUNTER_GENERATION_URL = "https://e-hentai.org/news.php?encounter";

const buildEncounterEntryUrl = (key) => `?s=Battle&ss=ba&encounter=${key}`;

export const parseSearchEncounterKey = (search = "") => /\?s=Battle&ss=ba&encounter=([A-Za-z0-9=]+)/.exec(search)?.[1];

export const parseEventpaneEncounterKey = (eventpane = "") => eventpane.match(/\?s=Battle&amp;ss=ba&amp;encounter=([A-Za-z0-9=]+)/)?.[1];

export function planEncounterEntryRoute(readiness) {
  if (readiness.canEnter) {
    return {
      action: "enter",
      href: buildEncounterEntryUrl(readiness.state.key),
      state: readiness.state,
    };
  }
  if (!readiness.state.key && !readiness.dailyLimitReached && readiness.remainingMs === 0) {
    return { action: "navigate", href: ENCOUNTER_GENERATION_URL, state: readiness.state };
  }
  return { action: "load", state: readiness.state };
}
