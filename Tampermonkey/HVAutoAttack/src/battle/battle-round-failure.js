import { setValue } from "../state/storage.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const BATTLE_ROUND_FAILURE_KEY = "HVAA:lastBattleRoundFailure";

export function recordBattleRoundFailure(stage, key, error) {
  const evidence = {
    capability: "battleRound",
    stage,
    key,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(BATTLE_ROUND_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Round failure evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] battle round persistence failed", evidence],
  });
  return evidence;
}

export function persistBattleRoundValue(stage, key, value) {
  try {
    setValue(key, value);
    return true;
  } catch (error) {
    recordBattleRoundFailure(stage, key, error);
    return false;
  }
}
