import { OptionEvent, runOptionAutomation } from "../state/option.js";

const ENCOUNTER_OPTION_KEY = "encounter";

export function isAutomaticEncounterEnabled() {
  return Boolean(
    runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: ENCOUNTER_OPTION_KEY,
      fallback: false,
    })
  );
}
