import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const ENCOUNTER_OPTION_KEY = "encounter";
const HVUT_RE_NOTIFICATION_OPTION_KEY = "reNotification";

export function createAutomaticEncounterGate(available, deps = {}) {
  const readOption = deps.readOption || runOptionAutomation;
  const readOptionFlag = (key, fallback) =>
    readOption({ type: OptionEvent.READ_FIELD, key, fallback });
  return Object.freeze({
    enabled() {
      if (!available) return false;
      if (readOptionFlag(ENCOUNTER_OPTION_KEY, false) === true) return true;
      return readOptionFlag(HVUT_RE_NOTIFICATION_OPTION_KEY, true) !== false;
    },
  });
}

const currentAutomaticEncounterGate = createAutomaticEncounterGate(
  CURRENT_WORLD_POLICY.features.randomEncounter
);

export function isAutomaticEncounterEnabled() {
  return currentAutomaticEncounterGate.enabled();
}
