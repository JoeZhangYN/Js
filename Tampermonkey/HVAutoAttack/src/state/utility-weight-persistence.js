import { STORAGE_KEYS } from "./persist-keys.js";
import { normalizeUtilityWeightDocument } from "./utility-weight-model.js";

export function readUtilityWeightPolicy(deps) {
  return Object.freeze({
    enabled: Boolean(deps.readOptionField("utilityWeightLearning", false)),
    fightingStyle: String(deps.readOptionField("fightingStyle", "1")),
  });
}

export function readUtilityWeightDocument(storage, deps, policy) {
  try {
    return normalizeUtilityWeightDocument(
      storage.getValue(STORAGE_KEYS.UTILITY_WEIGHT_LEARNING, true)
    );
  } catch (error) {
    deps.recordFailure("read", {
      auditIdentity: deps.auditIdentity,
      fightingStyle: policy.fightingStyle,
      error: error?.message || String(error),
    });
    return normalizeUtilityWeightDocument(null);
  }
}

export function persistUtilityWeightDocument(storage, deps, policy, documentValue) {
  try {
    storage.setValue(STORAGE_KEYS.UTILITY_WEIGHT_LEARNING, documentValue);
    return true;
  } catch (error) {
    deps.recordFailure("write", {
      auditIdentity: deps.auditIdentity,
      fightingStyle: policy.fightingStyle,
      error: error?.message || String(error),
    });
    return false;
  }
}
