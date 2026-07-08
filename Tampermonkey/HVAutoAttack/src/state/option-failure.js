import { STORAGE_KEYS } from "./persist-keys.js";
import { delValue, setValue } from "./storage.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const OPTION_FAILURE_KEY = "HVAA:lastOptionFailure";

export function recordOptionFailure(stage, error) {
  const evidence = {
    capability: "option",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(OPTION_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Option failure evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] option persistence failed", evidence],
  });
  return evidence;
}

export function persistOption(option) {
  try {
    setValue(STORAGE_KEYS.OPTION, option);
    return true;
  } catch (error) {
    recordOptionFailure("write", error);
    return false;
  }
}

export function clearPersistedOption() {
  try {
    delValue(STORAGE_KEYS.OPTION);
    return true;
  } catch (error) {
    recordOptionFailure("clear", error);
    return false;
  }
}
