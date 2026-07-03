const COMMON_CARRY_KEYS = Object.freeze(["equipset", "ch_style", "se_settings", "ss_log", "ml_log"]);
const PERSISTENT_CARRY_KEYS = Object.freeze(["equipnames", ...COMMON_CARRY_KEYS]);

export function getHvutConfigNamespace(segment) {
  return segment?.isIsekai ? "hvuti" : "hvut";
}

export function getHvutConfigCarryKeys(segment) {
  return segment?.isIsekai ? [...COMMON_CARRY_KEYS] : [...PERSISTENT_CARRY_KEYS];
}
