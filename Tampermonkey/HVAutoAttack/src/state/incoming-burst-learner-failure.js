import {
  LearnedMonsterFamily,
  LearnedMonsterStoreEvent,
  runLearnedMonsterStoreAutomation,
} from "./learned-monster-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";
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

export async function persistLearnedIncomingBurst(
  records,
  runStore = runLearnedMonsterStoreAutomation
) {
  try {
    const result = await runStore({
      type: LearnedMonsterStoreEvent.UPSERT_MANY,
      family: LearnedMonsterFamily.INCOMING_BURST,
      records,
    });
    if (result?.outcome === StorageWriteOutcome.FAILED) {
      recordIncomingBurstLearningFailure("update-learned", result.error);
      return false;
    }
    return true;
  } catch (error) {
    recordIncomingBurstLearningFailure("update-learned", error);
    return false;
  }
}
