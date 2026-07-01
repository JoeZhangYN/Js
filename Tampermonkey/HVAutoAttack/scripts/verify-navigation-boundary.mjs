import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const OWNER = "core/navigate.js";
const LEGACY_EXPORT_RE = /\bexport\s+function\s+(goto|scheduleReload|openUrl)\s*\(/;
const LEGACY_IMPORT_RE =
  /import\s*\{[^}]*\b(goto|scheduleReload|openUrl)\b[^}]*\}\s*from\s*["'][^"']*core\/navigate\.js["']/;

function collectJs(dir, base = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const abs = `${dir}/${name}`;
    const rel = base ? `${base}/${name}` : name;
    if (statSync(abs).isDirectory()) out.push(...collectJs(abs, rel));
    else if (name.endsWith(".js")) out.push({ abs, rel });
  }
  return out;
}

const files = collectJs(SRC_DIR);
const owner = files.find((file) => file.rel === OWNER);
const violations = [];

if (!owner) {
  violations.push(`src/${OWNER} is missing`);
} else {
  const source = stripComments(readFileSync(owner.abs, "utf8"));
  if (!/\bexport\s+const\s+NavigationEvent\b/.test(source)) {
    violations.push("NavigationEvent must be the public navigation command vocabulary");
  }
  if (!/\bexport\s+function\s+runNavigationAutomation\s*\(/.test(source)) {
    violations.push("runNavigationAutomation(event) must be the only public navigation entry");
  }
  if (LEGACY_EXPORT_RE.test(source)) {
    violations.push("legacy navigation helpers must stay private: goto/scheduleReload/openUrl");
  }
  if (!source.includes("OPEN_WINDOW")) {
    violations.push("NavigationEvent must expose OPEN_WINDOW for named popup navigation");
  }
  if (!/\bexport\s+const\s+NavigationWindowReason\b/.test(source)) {
    violations.push("NavigationWindowReason must be the public popup navigation reason vocabulary");
  }
  if (!/\bexport\s+const\s+NavigationReloadReason\b/.test(source)) {
    violations.push("NavigationReloadReason must be the public reload reason vocabulary");
  }
  if (!source.includes("BATTLE_API_RESPONSE")) {
    violations.push("NavigationReloadReason must include battle API response reloads");
  }
  if (!source.includes("RELOAD_RETRY_DELAY_MS")) {
    violations.push("reload retry delay must be a named navigation invariant");
  }
  if (!/\bexport\s+const\s+NavigationRedirectReason\b/.test(source)) {
    violations.push("NavigationRedirectReason must be the public redirect reason vocabulary");
  }
  if (!source.includes("isReloadReasonAllowed")) {
    violations.push("reloadNow/scheduleReload must validate an allowed reload reason");
  }
  if (!source.includes("goto(event.reason, event.detail)")) {
    violations.push("reloadNow must preserve reload detail in navigation audit");
  }
  if (!source.includes("setTimeout(() => goto(event.reason, event.detail), delayMs)")) {
    violations.push("scheduled reload must preserve reload detail in navigation audit");
  }
  if (!source.includes("attempt + 1") || !source.includes("retryDelayMs: RELOAD_RETRY_DELAY_MS")) {
    violations.push("reload retry audit must record attempt and retryDelayMs");
  }
  if (!source.includes("isRedirectReasonAllowed")) {
    violations.push("openUrl must validate an allowed redirect reason");
  }
  if (!source.includes("isWindowReasonAllowed")) {
    violations.push("openWindow must validate an allowed window reason");
  }
  if (!source.includes("opened: Boolean(openedWindow)")) {
    violations.push("openWindow audit must record whether the popup was actually opened");
  }
  const auditSource = files.find((file) => file.rel === "core/navigation-audit.js");
  const diagnosticEvidenceSource = files.find((file) => file.rel === "core/diagnostic-evidence.js");
  if (!auditSource) {
    violations.push("core/navigation-audit.js is missing");
  } else {
    const auditText = stripComments(readFileSync(auditSource.abs, "utf8"));
    if (!source.includes("writeNavigationAudit")) {
      violations.push("navigation execution must record an audit before navigating");
    }
    if (
      !auditText.includes("sessionStorage.setItem") ||
      !auditText.includes("reportPreviousNavigationAudit")
    ) {
      violations.push("navigation audit must persist and replay across page reloads");
    }
    if (
      !auditText.includes("recordExternalUnload") ||
      !auditText.includes("outsideNavigationEntry")
    ) {
      violations.push("navigation audit must record unloads that bypass the navigation entry");
    }
    for (const required of [
      "DiagnosticEvidenceKey.NAVIGATION_AUDIT",
      "readRecentDiagnosticEvidence",
      "diagnosticEvidence",
    ]) {
      if (!auditText.includes(required)) {
        violations.push(`navigation audit must carry diagnostic evidence ${required}`);
      }
    }
    for (const required of ["storageWriteOk", "storageWriteError"]) {
      if (!auditText.includes(required)) {
        violations.push(`navigation audit must expose storage write evidence ${required}`);
      }
    }
    if (
      /catch\s*\(_error\)\s*\{\s*return;\s*\}\s*writeNavigationAudit\("externalUnload"/.test(
        auditText
      )
    ) {
      violations.push("external unload audit must not disappear when storage reads fail");
    }
    if (!auditText.includes("console.warn(`[HVAA] ${kind}`")) {
      violations.push("navigation audit must warn before navigating");
    }
  }
  if (!diagnosticEvidenceSource) {
    violations.push("core/diagnostic-evidence.js is missing");
  } else {
    const diagnosticEvidenceText = stripComments(
      readFileSync(diagnosticEvidenceSource.abs, "utf8")
    );
    for (const required of [
      "DiagnosticEvidenceKey.NAVIGATION_DECISION",
      "DiagnosticEvidenceKey.BATTLE_TURN_WORKFLOW",
      "DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY",
      "DiagnosticEvidenceKey.BATTLE_COMMAND",
      "DiagnosticEvidenceKey.BATTLE_PAUSE",
      "DiagnosticEvidenceKey.BATTLE_ACTION_DELAY",
      "DiagnosticEvidenceKey.BATTLE_ACTION_LIFECYCLE",
      "DiagnosticEvidenceKey.BATTLE_ACTION_DECISION",
      "DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT",
      "readRecentDiagnosticEvidence",
      "navigationDecision",
      "battleTurnWorkflow",
      "battleApiResponseRecovery",
      "battleCommand",
      "battlePause",
      "battleActionDelay",
      "battleActionLifecycle",
      "battleActionDecision",
      "battleActionEffect",
    ]) {
      if (!diagnosticEvidenceText.includes(required)) {
        violations.push(`diagnostic evidence must read ${required}`);
      }
    }
    const diagnosticEvidenceTest = files.find(
      (file) => file.rel === "core/diagnostic-evidence.test.js"
    );
    const externalUnloadTest = files.find(
      (file) => file.rel === "core/navigate-external-unload.test.js"
    );
    for (const testSource of [diagnosticEvidenceTest, externalUnloadTest]) {
      if (!testSource) {
        violations.push("diagnostic evidence consumers must have tests");
        continue;
      }
      const testText = stripComments(readFileSync(testSource.abs, "utf8"));
      if (!testText.includes("knownResultKind: true")) {
        violations.push(`${testSource.rel} must preserve action result-kind diagnostic evidence`);
      }
    }
    const externalUnloadText = externalUnloadTest
      ? stripComments(readFileSync(externalUnloadTest.abs, "utf8"))
      : "";
    for (const required of [
      "warns about external unloads even when navigation audit storage is unavailable",
      "storageWriteOk: false",
      'storageWriteError: "write blocked"',
    ]) {
      if (!externalUnloadText.includes(required)) {
        violations.push(`external unload audit test must cover ${required}`);
      }
    }
  }
  const navigationDecisionSource = files.find(
    (file) => file.rel === "core/navigation-decision-evidence.js"
  );
  const navigationRejectionTestSource = files.find(
    (file) => file.rel === "core/navigate-rejection.test.js"
  );
  const openWindowAuditTestSource = files.find(
    (file) => file.rel === "core/navigate-open-window-audit.test.js"
  );
  const scheduledReloadDetailTestSource = files.find(
    (file) => file.rel === "core/navigate-scheduled-reload-detail.test.js"
  );
  if (!navigationDecisionSource) {
    violations.push("core/navigation-decision-evidence.js is missing");
  } else {
    const navigationDecisionText = stripComments(
      readFileSync(navigationDecisionSource.abs, "utf8")
    );
    for (const required of [
      "recordNavigationDecision",
      "DiagnosticEvidenceKey.NAVIGATION_DECISION",
      "[HVAA] navigation decision",
      "eventType: event?.type ?? null",
      "commandReason: event?.reason ?? null",
      "storageWriteOk",
      "storageWriteError",
    ]) {
      if (!navigationDecisionText.includes(required)) {
        violations.push(`navigation decision evidence must own ${required}`);
      }
    }
    for (const required of [
      'recordNavigationDecision("accepted"',
      'recordNavigationDecision("rejected"',
      "reloadReasonNotAllowed",
      "redirectReasonNotAllowed",
      "invalidReloadDelay",
      "unknownNavigationEvent",
    ]) {
      if (!source.includes(required)) {
        violations.push(`navigation entry must record decision evidence ${required}`);
      }
    }
  }
  const navigationDecisionTestSource = files.find(
    (file) => file.rel === "core/navigation-decision-evidence.test.js"
  );
  if (!navigationDecisionTestSource) {
    violations.push("core/navigation-decision-evidence.test.js must cover navigation decisions");
  } else {
    const navigationDecisionTestText = stripComments(
      readFileSync(navigationDecisionTestSource.abs, "utf8")
    );
    for (const required of [
      "warns with structured evidence when decision storage is unavailable",
      "storageWriteOk: false",
      'storageWriteError: "write blocked"',
    ]) {
      if (!navigationDecisionTestText.includes(required)) {
        violations.push(`navigation decision test must cover ${required}`);
      }
    }
  }
  if (!navigationRejectionTestSource) {
    violations.push(
      "core/navigate-rejection.test.js must cover unknown/null navigation rejection evidence"
    );
  } else {
    const navigationRejectionTestText = stripComments(
      readFileSync(navigationRejectionTestSource.abs, "utf8")
    );
    for (const required of [
      "records rejected evidence for unknown navigation events",
      "rejects null navigation events with structured evidence instead of throwing",
      "HVAA:lastNavigationDecision",
      "unknownNavigationEvent",
      "eventType: null",
      "commandReason: null",
    ]) {
      if (!navigationRejectionTestText.includes(required)) {
        violations.push(`navigation rejection test must cover ${required}`);
      }
    }
  }
  if (!openWindowAuditTestSource) {
    violations.push(
      "core/navigate-open-window-audit.test.js must cover popup audit and reason rejection"
    );
  } else {
    const openWindowAuditTestText = stripComments(
      readFileSync(openWindowAuditTestSource.abs, "utf8")
    );
    for (const required of [
      "records named popup windows with an allowed reason",
      "rejects named popup windows without an allowed reason",
      "NavigationWindowReason.RIDDLE_POPUP",
      "HVAA:lastNavigationAudit",
      "opened: false",
    ]) {
      if (!openWindowAuditTestText.includes(required)) {
        violations.push(`open window navigation audit test must cover ${required}`);
      }
    }
  }
  if (!scheduledReloadDetailTestSource) {
    violations.push(
      "core/navigate-scheduled-reload-detail.test.js must cover reload attempt evidence"
    );
  } else {
    const scheduledReloadDetailTestText = stripComments(
      readFileSync(scheduledReloadDetailTestSource.abs, "utf8")
    );
    for (const required of [
      "records reload retry attempts separately from the initial reload",
      "attempt: 1",
      "attempt: 2",
      "retryDelayMs: 5000",
      "HVAA:lastNavigationDecision",
    ]) {
      if (!scheduledReloadDetailTestText.includes(required)) {
        violations.push(`scheduled reload detail test must cover ${required}`);
      }
    }
  }
  const bridgeSource = files.find((file) => file.rel === "core/navigation-bridge.js");
  const bridgeTestSource = files.find((file) => file.rel === "core/navigation-bridge.test.js");
  if (!bridgeSource) {
    violations.push("core/navigation-bridge.js is missing");
  } else {
    const bridgeText = stripComments(readFileSync(bridgeSource.abs, "utf8"));
    const bridgeTestText = bridgeTestSource
      ? stripComments(readFileSync(bridgeTestSource.abs, "utf8"))
      : "";
    if (
      !bridgeText.includes("unsafeWindow") ||
      !bridgeText.includes("detail") ||
      !bridgeTestText.includes("BATTLE_API_RESPONSE") ||
      !bridgeTestText.includes("passes reload detail through the bridge")
    ) {
      violations.push("navigation bridge must expose reload reasons to the page context");
    }
  }
  if (!/Number\.isFinite\(delayMs\)\s*&&\s*delayMs\s*>\s*0/.test(source)) {
    violations.push("scheduled reload delay must be finite and positive");
  }
  for (const required of ["event.seconds", "event.minutes", "event.milliseconds"]) {
    if (!source.includes(required)) {
      violations.push(`NavigationEvent.SCHEDULE_RELOAD must normalize ${required}`);
    }
  }
  if (/\bevent\.sec\b/.test(source)) {
    violations.push(
      "legacy SCHEDULE_RELOAD sec field must stay deleted; use seconds/minutes/milliseconds"
    );
  }
  if (!source.includes("const navigationEventHandlers")) {
    violations.push("runNavigationAutomation(event) must route through navigationEventHandlers");
  }
  if (!source.includes("navigationEventHandlers[event?.type]")) {
    violations.push(
      "runNavigationAutomation(event) must reject null events with decision evidence"
    );
  }
  const entry = source.match(/export function runNavigationAutomation[\s\S]*?\n}/)?.[0] || "";
  if (/if\s*\(\s*event\.type\s*===/.test(entry)) {
    violations.push("runNavigationAutomation(event) must not reintroduce an event.type if-chain");
  }
  for (const internal of ["goto(", "scheduleReload(", "openUrl(", "openWindow("]) {
    if (entry.includes(internal)) {
      violations.push(
        "runNavigationAutomation(event) must dispatch through navigationEventHandlers"
      );
    }
  }
}

for (const file of files) {
  if (file.rel === OWNER) continue;
  const source = stripComments(readFileSync(file.abs, "utf8"));
  if (LEGACY_IMPORT_RE.test(source)) {
    violations.push(`src/${file.rel} imports legacy navigation helper directly`);
  }
  if (/NavigationEvent\.SCHEDULE_RELOAD[\s\S]{0,120}\bsec\s*:/.test(source)) {
    violations.push(`src/${file.rel} uses legacy SCHEDULE_RELOAD sec field`);
  }
  if (/\b(?:window\.)?location\.href\s*=|\bwindow\.open\s*\(/.test(source)) {
    violations.push(
      `src/${file.rel} must route navigation effects through runNavigationAutomation(event)`
    );
  }
  if (!file.rel.endsWith(".test.js")) {
    const reloadEvents = source.matchAll(
      /type\s*:\s*NavigationEvent\.(?:RELOAD_NOW|SCHEDULE_RELOAD)/g
    );
    for (const match of reloadEvents) {
      const eventBody = source.slice(match.index, match.index + 220);
      if (!/\breason\b/.test(eventBody)) {
        violations.push(`src/${file.rel} reload navigation events must carry reason`);
      }
      if (file.rel.startsWith("battle/") && !/\bdetail\b/.test(eventBody)) {
        violations.push(
          `src/${file.rel} battle reload navigation events must carry detail evidence`
        );
      }
    }
    const redirectEvents = source.matchAll(/type\s*:\s*NavigationEvent\.OPEN_URL/g);
    for (const match of redirectEvents) {
      const eventBody = source.slice(match.index, match.index + 220);
      if (!/\breason\b/.test(eventBody)) {
        violations.push(`src/${file.rel} redirect navigation events must carry reason`);
      }
    }
    const windowEvents = source.matchAll(/type\s*:\s*NavigationEvent\.OPEN_WINDOW/g);
    for (const match of windowEvents) {
      const eventBody = source.slice(match.index, match.index + 220);
      if (!/\breason\b/.test(eventBody)) {
        violations.push(`src/${file.rel} popup navigation events must carry reason`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("[verify-navigation-boundary] FAIL");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-navigation-boundary] OK — navigation effects route through runNavigationAutomation(event)"
);
