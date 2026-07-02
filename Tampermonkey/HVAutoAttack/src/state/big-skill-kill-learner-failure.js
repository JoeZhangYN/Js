import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";

export const BIG_SKILL_KILL_LEARNING_FAILURE_KEY = "HVAA:lastBigSkillKillLearningFailure";

export function recordBigSkillKillLearningFailure(stage, error) {
  const evidence = {
    capability: "bigSkillKillLearning",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(BIG_SKILL_KILL_LEARNING_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Big-skill kill learning evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] big-skill kill learning persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistLearnedBigKill(learned) {
  try {
    setValue(STORAGE_KEYS.LEARNED_BIG_KILL, learned);
    return true;
  } catch (error) {
    recordBigSkillKillLearningFailure("update-learned", error);
    return false;
  }
}
