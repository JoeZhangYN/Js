import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "src/i18n/hv-utils.js");
const diagnosticKeys = path.join(root, "src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.join(root, "src/core/diagnostic-evidence.test.js");
const text = fs.readFileSync(target, "utf8");
const diagnosticKeysText = fs.readFileSync(diagnosticKeys, "utf8");
const diagnosticTestText = fs.readFileSync(diagnosticTest, "utf8");
const violations = [];

const failureBody =
  text.match(/var record_hvut_navigation_bridge_failure = function \(stage, detail\) \{[\s\S]*?\n  \};/)?.[0] || "";
const bridgeBody =
  text.match(/var run_hvut_navigation_bridge = function \(method, args, stage, detail\) \{[\s\S]*?\n  \};/)?.[0] || "";
const reloadBody =
  text.match(/var reloadCurrentPage = function \(reason\) \{[\s\S]*?\n  \};/)?.[0] || "";
const openBody =
  text.match(/var openUrl = function \(url, reason, newTab\) \{[\s\S]*?\n  \};/)?.[0] || "";

if (!failureBody) violations.push("HVUT navigation bridge failure recorder must stay explicit");
if (!bridgeBody) violations.push("HVUT navigation bridge command must stay explicit");
if (!reloadBody) violations.push("HVUT reload bridge wrapper must stay explicit");
if (!openBody) violations.push("HVUT openUrl bridge wrapper must stay explicit");

for (const required of [
  "capability: 'hvutNavigationBridge'",
  "sessionStorage.setItem('HVAA:lastHvutNavigationBridgeFailure'",
  "console.warn('[HVAA] navigation bridge missing', evidence)",
  "HVUT navigation fallback must not depend on diagnostic storage.",
  "Console hooks must not block HVUT navigation fallback.",
]) {
  if (!failureBody.includes(required)) {
    violations.push(`HVUT navigation bridge failure recorder must include ${required}`);
  }
}

for (const required of [
  "var bridge = typeof window !== 'undefined' ? window.HVAA_navigation : undefined;",
  "if (!bridge || typeof bridge[method] !== 'function') {",
  "record_hvut_navigation_bridge_failure(stage, detail || {});",
  "return bridge[method](...(args || []));",
  "record_hvut_navigation_bridge_failure(stage + 'Failed'",
  "return false",
]) {
  if (!bridgeBody.includes(required)) {
    violations.push(`HVUT navigation bridge command must include ${required}`);
  }
}

for (const required of [
  "return run_hvut_navigation_bridge('reloadCurrentPage', [reason], 'reloadBlocked', { reason: reason });",
]) {
  if (!reloadBody.includes(required)) {
    violations.push(`HVUT reload bridge wrapper must include ${required}`);
  }
}

for (const required of [
  "return run_hvut_navigation_bridge('openUrl', [url, reason, !!newTab], 'navigationBlocked', { reason: reason, url: url, newTab: !!newTab });",
]) {
  if (!openBody.includes(required)) {
    violations.push(`HVUT openUrl bridge wrapper must include ${required}`);
  }
}

for (const forbidden of [
  "console.warn('[HVAA] navigation bridge missing; reload blocked'",
  "console.warn('[HVAA] navigation bridge missing; navigation blocked'",
  "window.HVAA_navigation.reloadCurrentPage(reason)",
  "window.HVAA_navigation.openUrl(url, reason, !!newTab)",
]) {
  if (text.includes(forbidden)) {
    violations.push(`HVUT navigation bridge must not keep retired direct path: ${forbidden}`);
  }
}

for (const required of [
  "HVUT_NAVIGATION_BRIDGE_FAILURE: \"HVAA:lastHvutNavigationBridgeFailure\"",
  "source(\"hvutNavigationBridgeFailure\", DiagnosticEvidenceKey.HVUT_NAVIGATION_BRIDGE_FAILURE)",
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`diagnostic evidence keys must expose ${required}`);
  }
}
for (const required of [
  "HVAA:lastHvutNavigationBridgeFailure",
  "hvutNavigationBridgeFailure: { capability: \"hvutNavigationBridge\", stage: \"reloadBlocked\" }",
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`diagnostic evidence test must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-navigation-bridge-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-navigation-bridge-boundary] OK - HVUT navigation bridge failures are persisted");
