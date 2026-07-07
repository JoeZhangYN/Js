import { OptionEvent, runOptionAutomation } from "../state/option.js";

const ENCOUNTER_OPTION_KEY = "encounter";
const HVUT_RE_NOTIFICATION_OPTION_KEY = "reNotification";

function readOptionFlag(key, fallback) {
  return runOptionAutomation({
    type: OptionEvent.READ_FIELD,
    key,
    fallback,
  });
}

export function isAutomaticEncounterEnabled() {
  if (readOptionFlag(ENCOUNTER_OPTION_KEY, false) === true) return true;
  return readOptionFlag(HVUT_RE_NOTIFICATION_OPTION_KEY, true) !== false;
}
