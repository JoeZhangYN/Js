import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const RECOVERY_LEARNING_FAILURE_KEY = "HVAA:lastRecoveryLearningFailure";

export function recordRecoveryLearningFailure(stage, error) {
  const evidence = {
    capability: "recoveryLearning",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(RECOVERY_LEARNING_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Recovery learning evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] recovery learning persistence failed", evidence],
  });
  return evidence;
}

export function recordRecoveryLearningDiagnostic(stage, detail) {
  return runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.INFO,
    args: [
      "[HVAA] recovery learning diagnostic",
      { capability: "recoveryLearning", stage, detail },
    ],
  });
}

export function recordDynamicRecoveryLearningDiagnostic(stage, detail) {
  const enabled = Boolean(
    runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "dynamicHealLog",
      fallback: false,
    })
  );
  return enabled ? recordRecoveryLearningDiagnostic(stage, detail) : false;
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
