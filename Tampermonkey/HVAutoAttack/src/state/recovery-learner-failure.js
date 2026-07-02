import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";

export const RECOVERY_LEARNING_FAILURE_KEY = "HVAA:lastRecoveryLearningFailure";

export function recordRecoveryLearningFailure(stage, error) {
  const evidence = {
    capability: "recoveryLearning",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(RECOVERY_LEARNING_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Recovery learning evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] recovery learning persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistLearnedRecovery(learned) {
  try {
    setValue(STORAGE_KEYS.LEARNED_RECOVERY, learned);
    return true;
  } catch (error) {
    recordRecoveryLearningFailure("update-learned", error);
    return false;
  }
}
