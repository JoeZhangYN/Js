const ENCOUNTER_GENERATION_URL = "https://e-hentai.org/news.php?encounter";

const buildEncounterEntryUrl = (key) => `?s=Battle&ss=ba&encounter=${key}`;

export function planEncounterEntryRoute(readiness) {
  if (readiness.canEnter) {
    return {
      action: "enter",
      href: buildEncounterEntryUrl(readiness.state.key),
      state: readiness.state,
    };
  }
  if (!readiness.dailyLimitReached && readiness.remainingMs === 0) {
    return {
      action: "generate",
      request: { method: "GET", url: ENCOUNTER_GENERATION_URL },
      state: readiness.state,
    };
  }
  return { action: "load", state: readiness.state };
}
