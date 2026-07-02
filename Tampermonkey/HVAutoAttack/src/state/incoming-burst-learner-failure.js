import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";

export const INCOMING_BURST_LEARNING_FAILURE_KEY = "HVAA:lastIncomingBurstLearningFailure";

export function recordIncomingBurstLearningFailure(stage, error) {
  const evidence = {
    capability: "incomingBurstLearning",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(INCOMING_BURST_LEARNING_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Incoming burst learning evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] incoming burst learning persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistLearnedIncomingBurst(learned) {
  try {
    setValue(STORAGE_KEYS.LEARNED_INCOMING_BURST, learned);
    return true;
  } catch (error) {
    recordIncomingBurstLearningFailure("update-learned", error);
    return false;
  }
}
