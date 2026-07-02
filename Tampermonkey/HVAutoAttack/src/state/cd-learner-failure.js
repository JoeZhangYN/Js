import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";

export const CD_LEARNING_FAILURE_KEY = "HVAA:lastCdLearningFailure";

export function recordCdLearningFailure(stage, error) {
  const evidence = {
    capability: "cdLearning",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(CD_LEARNING_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // CD learning evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] CD learning persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistLearnedCd(learned) {
  try {
    setValue(STORAGE_KEYS.LEARNED_CD, learned);
    return true;
  } catch (error) {
    recordCdLearningFailure("update-learned", error);
    return false;
  }
}
