import { AutoTuneEvent, runAutoTuneAutomation } from "../../state/auto-tune.js";
import {
  UtilityWeightLearningEvent,
  runUtilityWeightLearning,
} from "../../state/utility-weight-learner.js";

export function recordConsumedRecoveryItem() {
  const result = { autoTune: true, utilityWeight: true };
  try {
    runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_POTION_USE });
  } catch (error) {
    result.autoTune = false;
    result.autoTuneError = error?.message || String(error);
  }
  try {
    runUtilityWeightLearning({ type: UtilityWeightLearningEvent.RECORD_POTION_USE });
  } catch (error) {
    result.utilityWeight = false;
    result.utilityWeightError = error?.message || String(error);
  }
  return result;
}
