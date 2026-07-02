import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-api-bridge.js");
const ownerTest = path.normalize("src/battle/battle-api-bridge.test.js");
const ownerRejectionTest = path.normalize("src/battle/battle-api-bridge-rejection.test.js");
const runtimeTest = path.normalize("src/battle/battle-api-bridge-runtime.test.js");
const evidenceWarningFailureTest = path.normalize(
  "src/battle/battle-api-bridge-evidence-warning-failure.test.js"
);
const transportFailureTest = path.normalize(
  "src/battle/battle-api-bridge-transport-failure.test.js"
);
const apiCallScript = path.normalize("src/battle/battle-api-call-script.js");
const responseScript = path.normalize("src/battle/battle-api-response-script.js");
const responseScriptTest = path.normalize("src/battle/battle-api-response-script.test.js");
const responseScriptDiagnosticsTest = path.normalize(
  "src/battle/battle-api-response-script-diagnostics.test.js"
);
const responseScriptWarningFailureTest = path.normalize(
  "src/battle/battle-api-response-script-warning-failure.test.js"
);
const responseScriptMalformedJsonTest = path.normalize(
  "src/battle/battle-api-response-script-malformed-json.test.js"
);
const recovery = path.normalize("src/battle/battle-api-response-recovery.js");
const recoveryState = path.normalize("src/battle/battle-api-response-recovery-state.js");
const recoveryTest = path.normalize("src/battle/battle-api-response-recovery.test.js");
const recoveryNullEventTest = path.normalize(
  "src/battle/battle-api-response-recovery-null-event.test.js"
);
const recoveryEffectResultTest = path.normalize(
  "src/battle/battle-api-response-recovery-effect-result.test.js"
);
const recoveryMalformedJsonTest = path.normalize(
  "src/battle/battle-api-response-recovery-malformed-json.test.js"
);
const recoveryKeyFailureTest = path.normalize(
  "src/battle/battle-api-response-recovery-key-failure.test.js"
);
const recoveryReloadDetailTest = path.normalize(
  "src/battle/battle-api-response-recovery-reload-detail.test.js"
);
const recoveryPauseTest = path.normalize("src/battle/battle-api-response-recovery-pause.test.js");
const recoveryRejectionTest = path.normalize(
  "src/battle/battle-api-response-recovery-rejection.test.js"
);
const recoveryInstallFailureTest = path.normalize(
  "src/battle/battle-api-response-recovery-install-failure.test.js"
);
const recoveryPersistenceTest = path.normalize(
  "src/battle/battle-api-response-recovery-persistence.test.js"
);
const recoveryWarningTest = path.normalize(
  "src/battle/battle-api-response-recovery-warning.test.js"
);
const recoveryDiagnosticsTest = path.normalize(
  "src/battle/battle-api-response-recovery-diagnostics.test.js"
);
const diagnosticEvidenceKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const worldContext = path.normalize("src/battle/battle-api-world-context.js");
const worldContextTest = path.normalize("src/battle/battle-api-world-context.test.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function requireText(relative, required) {
  const text = read(relative);
  for (const token of required) {
    if (!text.includes(token)) {
      violations.push(`${relative.replaceAll("\\", "/")} must use ${token}`);
    }
  }
  return text;
}

const ownerText = requireText(owner, [
  "ACTION_START_EVENT_NODE_ID",
  "ACTION_END_EVENT_NODE_ID",
  "MAGIC_DELAY_SESSION_KEY",
  "ACTION_DELAY_SESSION_KEY",
  "BattleApiBridgeEvent",
  "battleApiBridgeEventHandlers",
  "runBattleApiBridgeAutomation",
  "rejectUnknownApiBridgeEvent",
  "OptionEvent.READ_FIELD",
  "BattleApiResponseRecoveryEvent.INSTALL_BRIDGE",
  "BattleApiResponseRecoveryEvent.REJECTED_API_BRIDGE_EVENT",
  "runBattleApiResponseRecovery",
  "buildApiCallScript",
  "worldContext.apiJsonUrl",
]);
const apiCallScriptText = requireText(apiCallScript, [
  "buildApiCallScript",
  "__HVAA_ACTION_START_EVENT_NODE_ID__",
  "__HVAA_ACTION_END_EVENT_NODE_ID__",
  "__HVAA_MAGIC_DELAY_SESSION_KEY__",
  "__HVAA_ACTION_DELAY_SESSION_KEY__",
  "typeof MAIN_URL",
  "battle_continue",
  "window.HVAA_navigation",
  "BATTLE_API_CALLBACK_FALLBACK",
  "missingBattleContinue",
  "callbackFallback",
  "navigationBridgeMissing",
  "clickActionEventNode",
  "recordApiBridgeEventNode",
  "warnApiBridgeEvidence",
  "API bridge behavior must not depend on diagnostic console hooks.",
  "warnCallbackFallbackBlocked",
  "Callback fallback behavior must not depend on diagnostic console hooks.",
  "recordApiTransportFailure",
  "runApiTransportStep",
  "sendApiRequest",
  "apiBridgeEvidenceKey",
  "apiTransportFailed",
  "eventNodeMissing",
  "eventNodeClickFailed",
  "DiagnosticEvidenceKey.BATTLE_API_BRIDGE",
]);
requireText(owner, [
  "buildApiResponseScript",
  "BattleApiWorldContextEvent.READ_CURRENT",
  "runBattleApiWorldContext",
  "readBattleApiWorldContext",
  "apiRecoveryBridgeInstallFailed",
  "apiBridgeInstallStepFailed",
  "rejectApiRecoveryBridgeInstallFailed",
  "rejectApiBridgeInstallStepFailed",
  "rejectApiBridgeEventSafely",
  "rejectApiBridgeEventError",
  "readApiBridgeDelayOption",
  "writeApiBridgeDelayRuntime",
]);
requireText(ownerTest, [
  'clickActionEventNode("start", "eventStart")',
  'clickActionEventNode("end", "eventEnd")',
  "HVAA:lastBattleApiBridge",
  "window.battle.battle_continue",
  "binds native process_action callbacks to the active battle instance",
  "does not navigate directly from generated API response handling",
  "blocks native process_action for API reload and error responses",
  "window.HVAA_battleApiRecovery",
  "recovery.handleRejectedResponse",
  "a.error || a.reload",
  "records API response reload evidence for diagnostics",
  "installApiResponseRecovery",
  "readBattleApiWorldContext",
  "runBattleApiWorldContext",
  '"world":"persistent"',
  "responseKind",
  "actionDetail",
  "uses the current battle world API endpoint on the default path",
  "https://hentaiverse.org/isekai/json",
  "window.sessionStorage.delay * 1",
  "window.sessionStorage.delay2 * 1",
  "BATTLE_API_CALLBACK_FALLBACK",
  "missingBattleContinue",
]);
requireText(ownerRejectionTest, [
  "rejects unknown events through API recovery evidence",
  "rejects null events through API recovery evidence instead of throwing",
  "records default unknown bridge events with bridge identity",
  "rejects API script installation when the recovery bridge cannot be installed",
  "records API bridge install step exceptions without throwing",
  "records default API bridge install step exceptions with step evidence",
  "falls back to recovery evidence when injected bridge rejection throws",
  "apiRecoveryBridgeInstallFailed",
  "apiBridgeInstallStepFailed",
  "reject hook failed",
  "rejectApiBridgeEventError",
  "unknownApiBridgeEvent",
  "rejectApiBridgeEvent",
  "readApiBridgeDelayOption",
  "readBattleApiWorldContext",
]);
requireText(runtimeTest, [
  "battle_continue-capable target",
  "non-capable window.battle object",
  "blocks fallback callback reload when the navigation bridge is missing",
  "callbackFallback",
  "navigationBridgeMissing",
  "records missing action start event nodes and blocks API send",
  "records action end event node click failures",
  "eventNodeMissing",
  "eventNodeClickFailed",
  "battleApiCallbackFallback",
  "missingBattleContinue",
  "window.MAIN_URL",
  "https://hentaiverse.org/isekai/json",
]);
requireText(evidenceWarningFailureTest, [
  "keeps API send blocked when bridge evidence storage and warning both fail",
  "keeps callback fallback rejected when warning hooks fail",
  "quota",
  "console blocked",
]);
requireText(transportFailureTest, [
  "records transport open failures before clicking the start event",
  "records transport send failures after the start event is clicked",
  "apiTransportFailed",
  "open failed",
  "send failed",
]);
const responseScriptText = requireText(responseScript, [
  "DiagnosticEvidenceKey",
  "API_RESPONSE_SCRIPT_DIAGNOSTIC_EVIDENCE_SOURCES",
  "buildApiResponseScript",
  "window.HVAA_battleApiRecovery",
  "recovery.handleRejectedResponse",
  "window.sessionStorage.setItem",
  "DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY",
  "__HVAA_DIAGNOSTIC_EVIDENCE_KEYS__",
  "diagnosticEvidenceKeys",
  "readRecentDiagnosticEvidence",
  "warnBlockedRecovery",
  "API response recovery must not depend on diagnostic console hooks.",
  "bridgeMissing",
  "bridgeThrew",
  "bridgeError",
  "a.error || a.reload",
  "parseApiJsonResponse",
  'responseKind: "malformedJson"',
  "responseKind",
  "actionDetail",
  "worldContext",
  "world: worldContext",
  'responseKind: "httpStatus"',
]);
requireText(diagnosticEvidenceKeys, [
  "DIAGNOSTIC_EVIDENCE_SOURCES",
  "API_RESPONSE_SCRIPT_DIAGNOSTIC_EVIDENCE_SOURCES",
  "BATTLE_API_BRIDGE",
  "battleApiBridge",
  "battleActionDelay",
  "DiagnosticEvidenceKey.BATTLE_ACTION_DELAY",
  "battleActionSpeed",
  "DiagnosticEvidenceKey.BATTLE_ACTION_SPEED",
  "item.key !== DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY",
]);
requireText(responseScriptTest, [
  "records blocked recovery evidence when the page bridge is missing",
  "records blocked recovery evidence when the recovery bridge throws",
  "routes rejected API responses through the recovery bridge when available",
  "HVAA:battleApiRecovery",
  "bridgeMissing",
  "bridgeThrew",
  "bridgeError",
  "recoveryAction",
]);
requireText(responseScriptDiagnosticsTest, [
  "carries recent diagnostic evidence into bridge-missing recovery state",
  "HVAA:battleApiRecovery",
  "bridgeMissing",
  "recoveryAction",
  "DiagnosticEvidenceKey.BATTLE_ACTION_DECISION",
  "DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT",
  "DiagnosticEvidenceKey.BATTLE_COMPLETION",
  "DiagnosticEvidenceKey.BATTLE_ACTION_DELAY",
  "DiagnosticEvidenceKey.BATTLE_ACTION_SPEED",
  "failureReason",
  "DiagnosticEvidenceKey.BATTLE_API_BRIDGE",
  "battleApiBridge",
  "battleCompletion",
  "battleActionDelay",
  "unknownActionDelayEvent",
  "battleActionSpeed",
  "unknownActionSpeedEvent",
  "battleApiResponseRecovery",
]);
requireText(responseScriptWarningFailureTest, [
  "keeps rejected API responses blocked when recovery storage and warning both fail",
  "quota",
  "console blocked",
]);
requireText(responseScriptMalformedJsonTest, [
  "routes malformed JSON responses through the recovery bridge instead of throwing",
  "malformedJson",
  "parseError",
  "responseTextPreview",
]);
const worldContextText = requireText(worldContext, [
  "BattleApiWorldContextEvent",
  "battleApiWorldContextEventHandlers",
  "runBattleApiWorldContext",
  "WORLD_ISEKAI",
  "WORLD_PERSISTENT",
  "apiJsonUrl",
  "hvcAssetId",
  "hvcScriptSrc",
  "isIsekai",
  "ISEKAI_URL",
  "MAIN_URL",
]);
requireText(worldContextTest, [
  "classifies persistent battle API authority",
  "classifies isekai battle API authority",
  "rejects unknown world context events",
  "rejects null world context events without reading document authority",
  "https://hentaiverse.org/json",
  "https://hentaiverse.org/isekai/json",
  "/z/091c/hvc.js",
]);
const recoveryText = requireText(recovery, [
  "BattleApiResponseRecoveryEvent",
  "battleApiResponseRecoveryEventHandlers",
  "runBattleApiResponseRecovery",
  "NavigationReloadReason.BATTLE_API_RESPONSE",
  "BattlePauseEvent.PAUSE",
  "readRecentDiagnosticEvidence",
  "API_RECOVERY_SESSION_KEY",
  "API_RECOVERY_BRIDGE_NAME",
  "REASON_API_RECOVERY_BRIDGE_INSTALL_THREW",
  "REPEAT_PAUSE_THRESHOLD",
  "EVENT_UNKNOWN_API_RECOVERY",
  "EVENT_REJECTED_API_BRIDGE_EVENT",
  "EVENT_UNKNOWN_API_BRIDGE",
  "OUTCOME_REJECTED",
  "RECOVERY_ACTION_RELOAD",
  "RECOVERY_ACTION_PAUSE",
  "RECOVERY_ACTION_REJECTED",
  "rejectUnknownApiRecoveryEvent",
  "rejectApiBridgeEvent",
  "detail?.reason ?? EVENT_UNKNOWN_API_BRIDGE",
  "step: detail?.step",
  "error: detail?.error",
  "rejectApiBridgeEventError: detail?.rejectApiBridgeEventError",
  "unknownApiResponseRecoveryEvent",
  "unknownApiBridgeEvent",
  "apiRecoveryBridgeInstallThrew",
  "buildRecoveryState",
  "buildRejectedRecoveryState",
  "handleRejectedApiResponse",
  "recordRecoveryEffectResult",
  '"reloadResult"',
  '"pauseResult"',
  '"reloadError"',
  '"pauseError"',
  "deps.pause(state)",
  "recoveryAction",
  'reason: "battleApiResponseRepeated"',
  "detail: state",
  "deps.reload(state)",
  "repeatCount >= REPEAT_PAUSE_THRESHOLD",
]);
const recoveryStateText = requireText(recoveryState, [
  "DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY",
  "API_RECOVERY_SESSION_KEY",
  "fallbackRecoveryStates",
  "fallbackRecoveryStates.get(deps.sessionStorage)",
  "fallbackRecoveryStates.set(deps.sessionStorage",
  "fallbackRecoveryStates.delete(deps.sessionStorage)",
  "apiFailureKey",
  "apiFailureKeyParts",
  "apiFailureKeyError",
  "keyFallback: \"unserializableApiFailure\"",
  "jsonSafeRecoveryState",
  "\"[Circular]\"",
  "typeof value === \"bigint\"",
  "buildRecoveryState",
  "buildRejectedRecoveryState",
  "readRecoveryDiagnosticEvidence",
  "diagnosticEvidenceReadError",
  "diagnosticEvidenceWithoutApiRecovery",
  "storageWriteOk",
  "storageWriteError",
  "battle API recovery state write failed",
  "recordRecoveryEffectResult",
  "warnRecoveryStateSafely",
  "battle API recovery effect failed",
  "state[resultName] = Boolean(result)",
  "state[errorName] = error?.message || String(error)",
  "world: detail?.world",
  "parseError: detail?.parseError",
]);
requireText(recoveryTest, [
  "installs one page bridge that routes rejected responses through the recovery entry",
  "reloads once for a rejected API response with preserved evidence",
  "pauses instead of reloading repeated same-cause API rejection loops",
  "carries recent battle diagnostic evidence into repeated API pause state",
  "does not treat different rejected response evidence as the same loop",
  "does not treat different battle worlds as the same recovery loop",
  "HVAA:battleApiRecovery",
  "recoveryAction",
  "knownResultKind: true",
  "battleApiBridge",
  "battleActionDelay",
  "unknownActionDelayEvent",
]);
requireText(recoveryEffectResultTest, [
  "records accepted reload scheduling in recovery evidence",
  "records rejected reload scheduling instead of claiming recovery effect success",
  "records thrown reload scheduling as failed recovery evidence",
  "records accepted repeated-pause execution in recovery evidence",
  "records rejected repeated-pause execution in recovery evidence",
  "records thrown repeated-pause execution as failed recovery evidence",
  "reloadResult: true",
  "reloadResult: false",
  'reloadError: "navigation bridge failed"',
  "pauseResult: true",
  "pauseResult: false",
  'pauseError: "pause bridge failed"',
  "HVAA:battleApiRecovery",
]);
requireText(recoveryReloadDetailTest, [
  "passes recovery state into the default navigation reload detail",
  "HVAA:lastNavigationDecision",
  'commandReason: "battleApiResponse"',
  'recoveryAction: "reload"',
]);
requireText(recoveryRejectionTest, [
  "rejects unknown recovery events with structured evidence",
  "rejects null recovery events with structured evidence instead of throwing",
  "records rejected API bridge events with bridge identity",
  "preserves explicit API bridge rejection reasons",
  "preserves API bridge rejection step evidence",
  "apiRecoveryBridgeInstallFailed",
  "apiBridgeInstallStepFailed",
  "carries recent diagnostics into rejected recovery events without nesting recovery state",
  "unknownApiBridgeEvent",
  "battleActionDecision",
  "battleActionEffect",
  "battleApiResponseRecovery).toBeUndefined",
  "HVAA:battleApiRecovery",
  'recoveryAction: "rejected"',
]);
requireText(recoveryInstallFailureTest, [
  "records recovery bridge install target failures without throwing",
  "apiRecoveryBridgeInstallThrew",
  "bridge setter failed",
  "HVAA:battleApiRecovery",
  'recoveryAction: "rejected"',
]);
requireText(recoveryPersistenceTest, [
  "continues reload recovery when recovery state persistence fails",
  "pauses repeated same-cause recovery through memory fallback when persistence fails",
  "rejects unknown recovery events without throwing when persistence fails",
  "storageWriteOk: false",
  'storageWriteError: "quota"',
  "battle API recovery state write failed",
]);
requireText(recoveryWarningTest, [
  "returns reload recovery when recovery state persistence and warning fail",
  "keeps repeated-pause recovery accepted when pause warning fails",
  'expect(result).toBe("reload")',
  "console hook failed",
  'storageWriteError: "quota"',
]);
requireText(recoveryMalformedJsonTest, [
  "does not treat different malformed JSON parse failures as the same loop",
  "malformedJson",
  "parseError",
]);
requireText(recoveryKeyFailureTest, [
  "continues reload recovery when API failure identity cannot be serialized",
  "still pauses repeated unserializable API response loops",
  "apiFailureKeyError",
  "circular",
  'recoveryAction: "reload"',
  'recoveryAction: "pause"',
]);
requireText(recoveryPauseTest, [
  "writes repeated API recovery state into pause evidence on the default path",
  "HVAA:lastBattlePause",
  "battleApiResponseRepeated",
  'recoveryAction: "pause"',
]);
requireText(recoveryDiagnosticsTest, [
  "exposes API recovery state through recent diagnostic evidence",
  "does not nest previous API recovery evidence inside the next recovery state",
  "records diagnostic read failures instead of throwing from rejected response recovery",
  "battleApiResponseRecovery",
  "HVAA:battleApiRecovery",
  'recoveryAction: "reload"',
  'diagnosticEvidenceReadError: "diagnostic storage failed"',
  "battleActionDelay",
  "unknownActionDelayEvent",
]);

if (
  /\bexport\s+(?:function|const)\s+(?!BattleApiBridgeEvent\b|runBattleApiBridgeAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattleApiBridgeAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_INSTALL\]/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route events through a frozen handler table`
  );
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (
  !ownerText.includes(
    "battleApiBridgeEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownApiBridgeEvent(event, deps)"
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route unknown events through API recovery evidence`
  );
}
const apiBridgeRejectionBody =
  ownerText.match(/function rejectUnknownApiBridgeEvent\(event, deps\) \{[\s\S]*?\n\}/)?.[0] || "";
const apiBridgeRejectionHelperBody =
  ownerText.match(/function rejectApiBridgeEventSafely\(deps, injectedDetail, recoveryDetail\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
for (const required of [
  "rejectApiBridgeEventSafely(deps, event ?? null, { eventType: event?.type ?? null })",
  "BattleApiResponseRecoveryEvent.REJECTED_API_BRIDGE_EVENT",
  "detail: recoveryDetail",
]) {
  if (!(apiBridgeRejectionBody + apiBridgeRejectionHelperBody).includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} API bridge rejection must include ${required}`);
  }
}
if (apiBridgeRejectionBody.includes("runBattleApiResponseRecovery(event ?? null)")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not misclassify bridge rejection as recovery rejection`
  );
}
if (/document\.getElementById\(["']event(Start|End)["']\)/.test(ownerText + apiCallScriptText)) {
  violations.push(
    `${apiCallScript.replaceAll("\\", "/")} must generate event node ids through protocol constants`
  );
}
if (/window\.sessionStorage\.(delay|delay2)\b/.test(ownerText + apiCallScriptText)) {
  violations.push(
    `${apiCallScript.replaceAll("\\", "/")} must generate delay keys through protocol constants`
  );
}
if (
  !apiCallScriptText.includes("window.battle.battle_continue") ||
  !apiCallScriptText.includes("window.HVAA_navigation") ||
  !apiCallScriptText.includes("BATTLE_API_CALLBACK_FALLBACK")
) {
  violations.push(
    `${apiCallScript.replaceAll("\\", "/")} must bind native process_action callbacks to a battle_continue-capable target and route fallback reloads through the navigation bridge`
  );
}
if (
  !apiCallScriptText.includes('recordApiBridgeEventNode("callbackFallback", null, "rejected"') ||
  !apiCallScriptText.includes('reason: "navigationBridgeMissing"')
) {
  violations.push(
    `${apiCallScript.replaceAll("\\", "/")} must record callback fallback reload blocks as API bridge evidence`
  );
}
if (
  !apiCallScriptText.includes("function warnApiBridgeEvidence") ||
  !apiCallScriptText.includes("API bridge behavior must not depend on diagnostic console hooks.") ||
  !read(evidenceWarningFailureTest).includes("bridge evidence storage and warning both fail")
) {
  violations.push(
    `${apiCallScript.replaceAll("\\", "/")} must isolate API bridge evidence storage and warning failures`
  );
}
if (
  !apiCallScriptText.includes("function warnCallbackFallbackBlocked") ||
  !apiCallScriptText.includes("Callback fallback behavior must not depend on diagnostic console hooks.") ||
  !read(evidenceWarningFailureTest).includes("callback fallback rejected when warning hooks fail")
) {
  violations.push(
    `${apiCallScript.replaceAll("\\", "/")} must isolate callback fallback warning failures`
  );
}
if (
  /document\.location\s*(?:\+=|=)/.test(
    ownerText + apiCallScriptText + read(ownerTest) + read(runtimeTest)
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} must not use document.location fallback reloads`);
}
if (/from\s+["']\.\.\/env\.js["']|isIsekai|ISEKAI_URL|BATTLE_API_BASE_URL/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must consume typed battle API world context`);
}
if (
  !ownerText.includes("worldContext.apiJsonUrl") ||
  !apiCallScriptText.includes("typeof MAIN_URL")
) {
  violations.push(`${owner.replaceAll("\\", "/")} must use typed API JSON URL from world context`);
}
if (!responseScriptText.includes("world: worldContext")) {
  violations.push(`${responseScript.replaceAll("\\", "/")} must audit rejected API world identity`);
}
if (!ownerText.includes("deps.installApiResponseRecovery()")) {
  violations.push(`${owner.replaceAll("\\", "/")} must install API recovery before scripts`);
}
if (
  !ownerText.includes(
    "if (!deps.installApiResponseRecovery()) return rejectApiRecoveryBridgeInstallFailed(deps)"
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must stop API script install when recovery bridge install fails`
  );
}
if (
  /NavigationReloadReason|BattlePauseEvent|runNavigationAutomation|runBattlePauseAutomation/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} must not choose recovery effects directly`);
}
if (/b\.onreadystatechange\s*=\s*d\b/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not install bare process_action callbacks`);
}
if (
  /window\.location|location\.href|window\.location\.search/.test(
    ownerText + apiCallScriptText + responseScriptText
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not navigate directly from API response handling`
  );
}
if (!responseScriptText.includes("function reloadFromApiResponse(detail)")) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} must classify API response reloads explicitly`
  );
}
if (!responseScriptText.includes("window.HVAA_battleApiRecovery")) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} page API response must call recovery bridge`
  );
}
if (!responseScriptText.includes("recordBlockedRecovery")) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} must record missing recovery bridge evidence`
  );
}
if (
  !responseScriptText.includes("function warnBlockedRecovery") ||
  !responseScriptText.includes("API response recovery must not depend on diagnostic console hooks.") ||
  !read(responseScriptWarningFailureTest).includes("recovery storage and warning both fail")
) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} must isolate blocked recovery storage and warning failures`
  );
}
if (
  !responseScriptText.includes("bridgeMissing") ||
  !responseScriptText.includes("recoveryAction: action")
) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} bridge-missing state must use recoveryAction`
  );
}
if (!responseScriptText.includes('"bridgeThrew"') || !responseScriptText.includes("bridgeError")) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} bridge-thrown recovery must be blocked with evidence`
  );
}
if (/recovery\s*:\s*["']bridgeMissing["']/.test(responseScriptText + read(responseScriptTest))) {
  violations.push("bridge-missing API recovery must not use legacy recovery field");
}
if (
  !responseScriptText.includes("const diagnosticEvidence = readRecentDiagnosticEvidence()") ||
  !responseScriptText.includes("state.diagnosticEvidence = diagnosticEvidence")
) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} bridge-missing recovery must carry recent diagnostics`
  );
}
if (responseScriptText.includes('name: "battleApiResponseRecovery"')) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} bridge-missing diagnostics must not self-nest API recovery`
  );
}
if (!responseScriptText.includes("a.error || a.reload")) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} must intercept API error/reload responses`
  );
}
if (
  !/a\.error \|\| a\.reload[\s\S]*reloadFromApiResponse\(\{[\s\S]*return false;/.test(
    responseScriptText
  )
) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} must block native process_action after API error/reload responses`
  );
}
if (!responseScriptText.includes("action: actionDetail()")) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} must audit the rejected API action shape`
  );
}
if (!responseScriptText.includes('responseKind: "httpStatus"')) {
  violations.push(`${responseScript.replaceAll("\\", "/")} must classify non-200 API responses`);
}
if (
  !responseScriptText.includes("function parseApiJsonResponse") ||
  !responseScriptText.includes('responseKind: "malformedJson"') ||
  !responseScriptText.includes("parseError") ||
  !responseScriptText.includes("responseTextPreview")
) {
  violations.push(
    `${responseScript.replaceAll("\\", "/")} must classify malformed JSON API responses`
  );
}
if (!/export\s+function\s+runBattleApiResponseRecovery/.test(recoveryText)) {
  violations.push(`${recovery.replaceAll("\\", "/")} must expose one recovery entry`);
}
if (
  !recoveryText.includes("battleApiResponseRecoveryEventHandlers[event?.type]?.(event, deps)") ||
  !recoveryText.includes("rejectUnknownApiRecoveryEvent(event, deps)")
) {
  violations.push(
    `${recovery.replaceAll("\\", "/")} must record recovery evidence for unknown events`
  );
}
if (
  !read(recoveryNullEventTest).includes(
    "rejects null recovery events with structured evidence instead of reloading"
  ) ||
  !read(recoveryNullEventTest).includes("runBattleApiResponseRecovery(null, deps)") ||
  !read(recoveryNullEventTest).includes('reason: "unknownApiResponseRecoveryEvent"')
) {
  violations.push(
    `${recoveryNullEventTest.replaceAll("\\", "/")} must lock null recovery event evidence`
  );
}
if (
  !recoveryText.includes(
    "[EVENT_REJECTED_API_BRIDGE_EVENT]: (event, deps) => rejectApiBridgeEvent(event.detail, deps)"
  )
) {
  violations.push(
    `${recovery.replaceAll("\\", "/")} must route API bridge rejections through explicit recovery event`
  );
}
if (
  !recoveryText.includes("item.value[API_RECOVERY_BRIDGE_NAME] = bridge") ||
  !recoveryText.includes("REASON_API_RECOVERY_BRIDGE_INSTALL_THREW") ||
  !recoveryText.includes("step: item.name")
) {
  violations.push(
    `${recovery.replaceAll("\\", "/")} recovery bridge installation must record target assignment failures`
  );
}
if (!recoveryText.includes("repeatCount >= REPEAT_PAUSE_THRESHOLD")) {
  violations.push(`${recovery.replaceAll("\\", "/")} must stop repeated API reload loops`);
}
if (!recoveryText.includes("deps.pause(state)") || !recoveryText.includes("deps.reload(state)")) {
  violations.push(
    `${recovery.replaceAll("\\", "/")} must choose between pause and reload centrally`
  );
}
if (
  !recoveryText.includes(
    'recordRecoveryEffectResult(deps, state, "pauseResult", () => deps.pause(state), "pauseError")'
  ) ||
  !recoveryText.includes(
    'recordRecoveryEffectResult(deps, state, "reloadResult", () => deps.reload(state), "reloadError")'
  )
) {
  violations.push(
    `${recovery.replaceAll("\\", "/")} must record API recovery effect results and exceptions after pause/reload attempts`
  );
}
if (!recoveryText.includes("detail: state")) {
  violations.push(
    `${recovery.replaceAll("\\", "/")} repeated API pause must carry recovery state detail`
  );
}
if (!recoveryText.includes("state.recoveryAction = RECOVERY_ACTION_RELOAD")) {
  violations.push(
    `${recovery.replaceAll("\\", "/")} reload navigation detail must carry recovery action state`
  );
}
if (!recoveryText.includes("state.recoveryAction = RECOVERY_ACTION_PAUSE")) {
  violations.push(
    `${recovery.replaceAll("\\", "/")} repeated API pause must carry recovery action state`
  );
}
if (!recoveryStateText.includes("world: detail?.world")) {
  violations.push(
    `${recoveryState.replaceAll("\\", "/")} repeat key must include battle world identity`
  );
}
if (/window\.location|location\.href|window\.location\.search/.test(recoveryText)) {
  violations.push(`${recovery.replaceAll("\\", "/")} must route reload through navigation entry`);
}
if (!/export\s+function\s+runBattleApiWorldContext/.test(worldContextText)) {
  violations.push(`${worldContext.replaceAll("\\", "/")} must expose one world context entry`);
}
if (!worldContextText.includes("battleApiWorldContextEventHandlers[event?.type]")) {
  violations.push(`${worldContext.replaceAll("\\", "/")} must reject null world context events`);
}
if (!worldContextText.includes("deps.isIsekai ? deps.isekaiUrl : deps.mainUrl")) {
  violations.push(`${worldContext.replaceAll("\\", "/")} must own battle API authority selection`);
}
if (!worldContextText.includes("world,") || !worldContextText.includes("WORLD_ISEKAI")) {
  violations.push(`${worldContext.replaceAll("\\", "/")} must preserve typed world identity`);
}
if (
  !worldContextText.includes("hvcAssetId") ||
  !worldContextText.includes('script[src*="/hvc.js"]')
) {
  violations.push(`${worldContext.replaceAll("\\", "/")} must expose current hvc asset identity`);
}

if (violations.length) {
  console.error("[verify-battle-api-bridge-protocol] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-api-bridge-protocol] OK - battle API bridge protocol is locked");
