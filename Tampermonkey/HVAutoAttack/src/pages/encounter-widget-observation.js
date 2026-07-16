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
