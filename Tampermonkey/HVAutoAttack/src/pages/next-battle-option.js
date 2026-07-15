import { OptionEvent, runOptionAutomation } from "../state/option.js";

export function isNextBattleOptionEnabled(key) {
  const value = runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback: false });
  return value === true || value === 1 || value === "1" || value === "true";
}
