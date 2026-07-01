import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export function buildApiResponseScript(worldContext) {
  return `api_response = ${function (b) {
    const worldContext = __HVAA_BATTLE_API_WORLD_CONTEXT__;
    const recoverySessionKey = "__HVAA_BATTLE_API_RECOVERY_SESSION_KEY__";
    const diagnosticEvidenceKeys = __HVAA_DIAGNOSTIC_EVIDENCE_KEYS__;
    function actionDetail() {
      const action = window.info || {};
      return {
        mode: action.mode,
        skill: action.skill,
        target: action.target,
        item: action.item,
      };
    }
    function writeRecoveryState(state) {
      try {
        window.sessionStorage.setItem(recoverySessionKey, JSON.stringify(state));
      } catch (_error) {
        // Diagnostic write failure must not resume native API processing.
      }
    }
    function readJson(key) {
      try {
        const raw = window.sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : undefined;
      } catch (_error) {
        return undefined;
      }
    }
    function readRecentDiagnosticEvidence() {
      const evidence = {};
      for (const item of diagnosticEvidenceKeys) {
        const value = readJson(item.key);
        if (value) evidence[item.name] = value;
      }
      return Object.keys(evidence).length ? evidence : undefined;
    }
    function recordBlockedRecovery(detail) {
      const blockedDetail = { ...detail, world: worldContext, action: actionDetail() };
      const state = {
        key: JSON.stringify({
          responseKind: blockedDetail.responseKind,
          status: blockedDetail.status,
          error: blockedDetail.error,
          reload: blockedDetail.reload,
          world: blockedDetail.world,
          action: blockedDetail.action,
          bridge: "missing",
        }),
        repeatCount: 1,
        detail: blockedDetail,
        recoveryAction: "bridgeMissing",
      };
      const diagnosticEvidence = readRecentDiagnosticEvidence();
      if (diagnosticEvidence) state.diagnosticEvidence = diagnosticEvidence;
      writeRecoveryState(state);
      console.warn("[HVAA] battle API recovery bridge missing; reload blocked", blockedDetail);
    }
    function reloadFromApiResponse(detail) {
      const recovery = window.HVAA_battleApiRecovery;
      if (recovery && recovery.handleRejectedResponse) {
        recovery.handleRejectedResponse({ ...detail, world: worldContext, action: actionDetail() });
        return true;
      }
      recordBlockedRecovery(detail);
      return false;
    }
    function parseApiJsonResponse(responseText, status) {
      try {
        return { ok: true, value: JSON.parse(responseText) };
      } catch (error) {
        reloadFromApiResponse({
          responseKind: "malformedJson",
          status,
          parseError: String(error && error.message ? error.message : error),
          responseTextPreview: String(responseText || "").slice(0, 200),
        });
        return { ok: false };
      }
    }
    if (b.readyState === 4) {
      if (b.status === 200) {
        const parsed = parseApiJsonResponse(b.responseText, b.status);
        if (!parsed.ok) return false;
        const a = parsed.value;
        if (a.login !== undefined) return false;
        if (a.error || a.reload) {
          reloadFromApiResponse({
            responseKind: a.reload ? "jsonReload" : "jsonError",
            status: b.status,
            error: a.error,
            reload: a.reload,
          });
          return false;
        }
        return a;
      }
      reloadFromApiResponse({ responseKind: "httpStatus", status: b.status });
    }
    return false;
  }.toString()}`
    .replace("__HVAA_BATTLE_API_WORLD_CONTEXT__", JSON.stringify(worldContext))
    .replace("__HVAA_BATTLE_API_RECOVERY_SESSION_KEY__", DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY)
    .replace(
      "__HVAA_DIAGNOSTIC_EVIDENCE_KEYS__",
      JSON.stringify([
        { name: "navigationDecision", key: DiagnosticEvidenceKey.NAVIGATION_DECISION },
        { name: "battleTurnWorkflow", key: DiagnosticEvidenceKey.BATTLE_TURN_WORKFLOW },
        { name: "battleCommand", key: DiagnosticEvidenceKey.BATTLE_COMMAND },
        { name: "battlePause", key: DiagnosticEvidenceKey.BATTLE_PAUSE },
        { name: "battleActionLifecycle", key: DiagnosticEvidenceKey.BATTLE_ACTION_LIFECYCLE },
        { name: "battleActionDecision", key: DiagnosticEvidenceKey.BATTLE_ACTION_DECISION },
        { name: "battleActionEffect", key: DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT },
      ])
    );
}
