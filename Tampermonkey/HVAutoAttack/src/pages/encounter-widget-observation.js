import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { readEncounterWidgetState } from "./encounter-widget-state.js";

const widgetState = (event, state = event.state) => readEncounterWidgetState(state, event);

export function observeWidgetLink(event) {
  const key =
    event.key ||
    runEncounterPolicy({ type: EncounterPolicyEvent.PARSE_SEARCH_KEY, search: event.search || "" });
  const state = runEncounterPolicy({
    type: key ? EncounterPolicyEvent.MARK_KEY_AVAILABLE : EncounterPolicyEvent.NORMALIZE,
    state: event.state,
    key,
    nowMs: event.nowMs,
  });
  return widgetState(event, state);
}

export function observeWidgetEntryStarted(event) {
  if (event.pageType !== "ba") return widgetState(event);
  const key =
    event.key ||
    runEncounterPolicy({
      type: EncounterPolicyEvent.PARSE_SEARCH_KEY,
      search: event.search || "",
    });
  if (!key) return widgetState(event);
  const state = runEncounterPolicy({
    type: EncounterPolicyEvent.MARK_ENTRY_STARTED,
    state: event.state,
    key,
    search: event.search,
    source: "encounterWidget",
    nowMs: event.nowMs,
  });
  return widgetState(event, state);
}
