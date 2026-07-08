export const BATTLE_API_SCRIPT_DIAGNOSTICS_PLACEHOLDER = "__HVAA_BATTLE_API_SCRIPT_DIAGNOSTICS__";

export function buildBattleApiScriptDiagnosticsSource() {
  return `const battleApiScriptDiagnosticEvent = Object.freeze({ WARN: "warn" });
    function runBattleApiScriptDiagnosticConsole(event) {
      const method = event && event.type === battleApiScriptDiagnosticEvent.WARN ? "warn" : null;
      if (!method) return false;
      try {
        const pageConsole = window.console || globalThis.console;
        pageConsole?.[method]?.(...(event.args || []));
      } catch (_error) {
        return false;
      }
      return true;
    }`;
}

export function injectBattleApiScriptDiagnostics(script) {
  const source = buildBattleApiScriptDiagnosticsSource();
  return script
    .replace(`"${BATTLE_API_SCRIPT_DIAGNOSTICS_PLACEHOLDER}";`, source)
    .replace(BATTLE_API_SCRIPT_DIAGNOSTICS_PLACEHOLDER, source);
}
