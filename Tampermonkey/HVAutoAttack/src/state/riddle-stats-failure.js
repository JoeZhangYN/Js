import { delValue, setValue } from "./storage.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const RIDDLE_STATS_KEY = "riddleStats";
export const RIDDLE_STATS_FAILURE_KEY = "HVAA:lastRiddleStatsFailure";

export function recordRiddleStatsFailure(stage, error) {
  const evidence = {
    capability: "riddleStats",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(RIDDLE_STATS_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Riddle stats evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] riddle stats persistence failed", evidence],
  });
  return evidence;
}

export function persistRiddleStats(stats, stage) {
  try {
    setValue(RIDDLE_STATS_KEY, stats);
    return true;
  } catch (error) {
    recordRiddleStatsFailure(stage, error);
    return false;
  }
}

export function clearPersistedRiddleStats() {
  try {
    delValue(RIDDLE_STATS_KEY);
    return true;
  } catch (error) {
    recordRiddleStatsFailure("reset", error);
    return false;
  }
}
