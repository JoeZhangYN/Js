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

export const BIG_SKILL_KILL_LEARNING_FAILURE_KEY = "HVAA:lastBigSkillKillLearningFailure";

export function recordBigSkillKillLearningFailure(stage, error) {
  const evidence = {
    capability: "bigSkillKillLearning",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(BIG_SKILL_KILL_LEARNING_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Big-skill kill learning evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] big-skill kill learning persistence failed", evidence],
  });
  return evidence;
}

export function recordBigSkillKillLearningDiagnostic(stage, detail) {
  return runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.INFO,
    args: [
      "[HVAA] big-skill kill learning diagnostic",
      { capability: "bigSkillKillLearning", stage, detail },
    ],
  });
}

export async function persistLearnedBigKill(records, runStore = runLearnedMonsterStoreAutomation) {
  try {
    const result = await runStore({
      type: LearnedMonsterStoreEvent.UPSERT_MANY,
      family: LearnedMonsterFamily.BIG_KILL,
      records,
    });
    if (result?.outcome === StorageWriteOutcome.FAILED) {
      recordBigSkillKillLearningFailure("update-learned", result.error);
      return false;
    }
    return true;
  } catch (error) {
    recordBigSkillKillLearningFailure("update-learned", error);
    return false;
  }
}
