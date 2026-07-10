import {
  UtilityWeightLearningEvent,
  runUtilityWeightLearning,
} from "../state/utility-weight-learner.js";

export function recordBattleUtilityAdverse(adverseType) {
  try {
    return runUtilityWeightLearning({
      type: UtilityWeightLearningEvent.RECORD_ADVERSE,
      adverseType,
    });
  } catch {
    return { kind: "failed", reason: "utilityAdverseRecordingThrew" };
  }
}
