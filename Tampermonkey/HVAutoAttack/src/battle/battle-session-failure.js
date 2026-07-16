import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const BATTLE_SESSION_FAILURE_KEY = "HVAA:lastBattleRoundFailure";

export function recordBattleSessionFailure(stage, detail = {}) {
  const evidence = {
    capability: "battleSession",
    stage,
    ...detail,
  };
  try {
    sessionStorage.setItem(BATTLE_SESSION_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Battle session failure evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] battle session failed", evidence],
  });
  return evidence;
}
