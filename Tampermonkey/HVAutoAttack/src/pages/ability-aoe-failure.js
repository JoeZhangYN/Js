import { STORAGE_KEYS } from "../state/persist-keys.js";
import { setValue } from "../state/storage.js";

export const ABILITY_AOE_FAILURE_KEY = "HVAA:lastAbilityAoeFailure";

export function recordAbilityAoeFailure(stage, failure) {
  const evidence = { capability: "abilityAoe", stage, failure };
  try {
    sessionStorage.setItem(ABILITY_AOE_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Ability AoE failure evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] ability AoE failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistAbilitySpellAoe(spellAoe) {
  try {
    setValue(STORAGE_KEYS.SPELL_AOE, spellAoe);
    return true;
  } catch (error) {
    recordAbilityAoeFailure("persist-spell-aoe", {
      kind: "storageWrite",
      key: STORAGE_KEYS.SPELL_AOE,
      error: error?.message || String(error),
    });
    return false;
  }
}
