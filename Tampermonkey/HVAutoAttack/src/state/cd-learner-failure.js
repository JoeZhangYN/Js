import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

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
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] CD learning persistence failed", evidence],
  });
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
