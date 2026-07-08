import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../../core/diagnostic-console.js";

export const I18N_RESTORE_FAILURE_KEY = "HVAA:lastI18nRestoreFailure";

function i18nFailureErrorText(error) {
  return error?.message || String(error);
}

export function recordI18nRestoreFailure(stage, error) {
  const evidence = {
    capability: "i18nRestore",
    stage,
    error: i18nFailureErrorText(error),
  };
  try {
    globalThis.sessionStorage?.setItem(I18N_RESTORE_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // i18n recovery must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.ERROR,
    args: ["[HVAA][i18n] " + stage + " 回调出错:", error],
  });
  return evidence;
}
