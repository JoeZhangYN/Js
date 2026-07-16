import {
  beginEncounterDay,
  defaultEncounterState,
  settleEncounterBattle,
  normalizeEncounterState,
  observeEncounterNewDay,
  resolveEncounterGenerationCircuit,
} from "./encounter-day-state.js";
import { readEncounterClock, readEncounterReadiness } from "./encounter-clock.js";
import { planEncounterEntryRoute } from "./encounter-entry-policy.js";
import { applyEncounterGenerationResult } from "./encounter-generation-application.js";
import {
  markEncounterAttempted,
  markEncounterBattleActive,
  markEncounterKeyAvailable,
} from "./encounter-entry-state.js";
import {
  parseEventpaneEncounterKey,
  parseSearchEncounterKey,
} from "./encounter-generation-result.js";
import { markEncounterGenerationFailed } from "./encounter-generation-recovery.js";

export const EncounterPolicyEvent = Object.freeze({
  APPLY_GENERATION_RESULT: "applyGenerationResult",
  BEGIN_NEW_DAY: "beginNewDay",
  DEFAULT_STATE: "defaultState",
  MARK_COMPLETED: "markCompleted",
  MARK_ENTRY_STARTED: "markEntryStarted",
  MARK_GENERATION_FAILED: "markGenerationFailed",
  MARK_KEY_AVAILABLE: "markKeyAvailable",
  MARK_ATTEMPTED: "markAttempted",
  NORMALIZE: "normalize",
  OBSERVE_NEW_DAY: "observeNewDay",
  PARSE_EVENTPANE_KEY: "parseEventpaneKey",
  PARSE_SEARCH_KEY: "parseSearchKey",
  PLAN_ACTIVATION: "planActivation",
  READ_CLOCK: "readClock",
  RESOLVE_GENERATION_CIRCUIT: "resolveGenerationCircuit",
});

function planEncounterActivation(state, nowMs = Date.now()) {
  return planEncounterEntryRoute(readEncounterReadiness(state, nowMs));
}

const encounterPolicyEventHandlers = Object.freeze({
  applyGenerationResult: (event) =>
    applyEncounterGenerationResult(event.state, event.result, event),
  beginNewDay: (event) => beginEncounterDay(event.nowMs),
  defaultState: (event) => defaultEncounterState(event.nowMs),
  markCompleted: (event) => settleEncounterBattle(event.state, event.session, event.nowMs),
  markEntryStarted: (event) => markEncounterBattleActive(event.state, event.session, event.nowMs),
  markGenerationFailed: (event) =>
    markEncounterGenerationFailed(
      normalizeEncounterState(event.state, event.nowMs),
      event.attemptKey,
      event.nowMs,
      event.reason
    ),
  markKeyAvailable: (event) => markEncounterKeyAvailable(event.state, event.key, event.nowMs),
  markAttempted: (event) => markEncounterAttempted(event.state, event.key, event.nowMs),
  normalize: (event) => normalizeEncounterState(event.state, event.nowMs),
  observeNewDay: (event) => observeEncounterNewDay(event.state, event.nowMs),
  parseEventpaneKey: (event) => parseEventpaneEncounterKey(event.eventpane),
  parseSearchKey: (event) => parseSearchEncounterKey(event.search),
  planActivation: (event) => planEncounterActivation(event.state, event.nowMs),
  readClock: (event) => readEncounterClock(event.state, event.nowMs),
  resolveGenerationCircuit: (event) =>
    resolveEncounterGenerationCircuit(event.state, event.nowMs, event.random),
});

export function runEncounterPolicy(event = { type: EncounterPolicyEvent.READ_CLOCK }) {
  return encounterPolicyEventHandlers[event?.type]?.(event);
}
