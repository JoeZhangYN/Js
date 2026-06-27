import {
  markEncounterKeyAvailable,
  markEncounterStarted,
  normalizeEncounterState,
  parseEncounterKeyFromEventpaneHtml,
  parseEncounterKeyFromSearch,
  planEncounterActivation,
  readEncounterReadiness,
  resetEncounterDay,
} from "./encounter-policy.js";

window.HVAA_encounter = Object.freeze({
  markEncounterKeyAvailable,
  markEncounterStarted,
  normalizeEncounterState,
  parseEncounterKeyFromEventpaneHtml,
  parseEncounterKeyFromSearch,
  planEncounterActivation,
  readEncounterReadiness,
  resetEncounterDay,
});
