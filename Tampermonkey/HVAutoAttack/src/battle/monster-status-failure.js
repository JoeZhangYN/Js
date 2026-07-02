import { setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

export const MONSTER_STATUS_FAILURE_KEY = "HVAA:lastMonsterStatusFailure";

export function recordMonsterStatusFailure(stage, error) {
  const evidence = {
    capability: "monsterStatus",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(MONSTER_STATUS_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Monster status failure evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] monster status persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistMonsterStatus(stage, monsterStatus) {
  try {
    setValue(STORAGE_KEYS.MONSTER_STATUS, monsterStatus);
    return true;
  } catch (error) {
    recordMonsterStatusFailure(stage, error);
    return false;
  }
}
