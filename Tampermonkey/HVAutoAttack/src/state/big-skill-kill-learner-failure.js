import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";
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

export function persistLearnedBigKill(learned) {
  try {
    setValue(STORAGE_KEYS.LEARNED_BIG_KILL, learned);
    return true;
  } catch (error) {
    recordBigSkillKillLearningFailure("update-learned", error);
    return false;
  }
}
