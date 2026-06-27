import { EncounterEvent, runEncounterAutomation } from "./encounter.js";

window.HVAA_encounter = Object.freeze({
  Event: EncounterEvent,
  run: runEncounterAutomation,
});
