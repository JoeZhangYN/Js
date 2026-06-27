import {
  buildEncounterUrl,
  canEnterEncounterState,
  markEncounterKeyAvailable,
  markEncounterStarted,
  msUntilEncounterReady,
  normalizeEncounterState,
  parseEncounterKeyFromEventpaneHtml,
  parseEncounterKeyFromSearch,
  resetEncounterDay,
} from "./encounter-policy.js";

window.HVAA_encounter = Object.freeze({
  buildEncounterUrl,
  canEnterEncounterState,
  markEncounterKeyAvailable,
  markEncounterStarted,
  msUntilEncounterReady,
  normalizeEncounterState,
  parseEncounterKeyFromEventpaneHtml,
  parseEncounterKeyFromSearch,
  resetEncounterDay,
});
