import { delValue, setValue } from "./storage.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const RIDDLE_LOG_KEY = "riddleLog";
export const RIDDLE_LOG_FAILURE_KEY = "HVAA:lastRiddleLogFailure";

export function recordRiddleLogFailure(stage, error) {
  const evidence = {
    capability: "riddleLog",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(RIDDLE_LOG_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Riddle log evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] riddle log persistence failed", evidence],
  });
  return evidence;
}

export function persistRiddleLog(entries) {
  try {
    setValue(RIDDLE_LOG_KEY, entries);
    return true;
  } catch (error) {
    recordRiddleLogFailure("persist", error);
    return false;
  }
}

export function clearPersistedRiddleLog() {
  try {
    delValue(RIDDLE_LOG_KEY);
    return true;
  } catch (error) {
    recordRiddleLogFailure("clear", error);
    return false;
  }
}
