import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const INCOMING_BURST_LEARNING_FAILURE_KEY = "HVAA:lastIncomingBurstLearningFailure";

export function recordIncomingBurstLearningFailure(stage, error) {
  const evidence = {
    capability: "incomingBurstLearning",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(INCOMING_BURST_LEARNING_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Incoming burst learning evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] incoming burst learning persistence failed", evidence],
  });
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
