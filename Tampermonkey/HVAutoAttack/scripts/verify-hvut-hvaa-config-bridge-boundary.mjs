import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvut = path.join(root, "src/i18n/hv-utils.js");
const diagnosticKeys = path.join(root, "src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.join(root, "src/core/diagnostic-evidence.test.js");
const text = fs.readFileSync(hvut, "utf8");
const keysText = fs.readFileSync(diagnosticKeys, "utf8");
const testText = fs.readFileSync(diagnosticTest, "utf8");
const violations = [];

const failureBody =
  text.match(/var record_hvut_hvaa_config_bridge_failure = function \(stage, detail\) \{[\s\S]*?\n  \};/)?.[0] || "";
const openBody =
  text.match(/var open_hvaa_config_from_hvut = function \(stage\) \{[\s\S]*?\n  \};/)?.[0] || "";
const textWithoutBridgeEntry = text.replace(openBody, "");

for (const [body, name] of [
  [failureBody, "failure recorder"],
  [openBody, "open command"],
]) {
  if (!body) violations.push(`HVUT HVAA config bridge ${name} must stay explicit`);
}

for (const required of [
  "capability: 'hvutHvaaConfigBridge'",
  "sessionStorage.setItem('HVAA:lastHvutHvaaConfigBridgeFailure'",
  "console.warn('[HVAA] HVUT HVAA config bridge failed', evidence)",
  "HVUT config bridge fallback must not depend on diagnostic storage.",
  "Console hooks must not block HVUT config bridge fallback.",
]) {
  if (!failureBody.includes(required)) {
    violations.push(`HVUT HVAA config bridge failure recorder must include ${required}`);
  }
}

for (const required of [
  "window.HVAA_openConfig",
  "record_hvut_hvaa_config_bridge_failure(stage, { reason: 'missingHvaaConfigBridge' })",
  "record_hvut_hvaa_config_bridge_failure(stage, { reason: 'hvaaConfigBridgeFailed'",
  "return false",
  "return true",
]) {
  if (!openBody.includes(required)) {
    violations.push(`HVUT HVAA config bridge open command must include ${required}`);
  }
}

for (const required of [
  "open_hvaa_config_from_hvut('topConfigIcon')",
  "open_hvaa_config_from_hvut('topConfigMenu')",
]) {
  if (!text.includes(required)) {
    violations.push(`HVUT config UI must call ${required}`);
  }
}

if (/window\.HVAA_openConfig/.test(textWithoutBridgeEntry)) {
  violations.push("HVUT UI must not call window.HVAA_openConfig outside open_hvaa_config_from_hvut");
}

for (const required of [
  'HVUT_HVAA_CONFIG_BRIDGE_FAILURE: "HVAA:lastHvutHvaaConfigBridgeFailure"',
  'source("hvutHvaaConfigBridgeFailure", DiagnosticEvidenceKey.HVUT_HVAA_CONFIG_BRIDGE_FAILURE)',
]) {
  if (!keysText.includes(required)) {
    violations.push(`diagnostic evidence keys must expose ${required}`);
  }
}

for (const required of [
  "HVAA:lastHvutHvaaConfigBridgeFailure",
  'hvutHvaaConfigBridgeFailure: { capability: "hvutHvaaConfigBridge", stage: "topConfigIcon" }',
]) {
  if (!testText.includes(required)) {
    violations.push(`diagnostic evidence test must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-hvaa-config-bridge-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-hvaa-config-bridge-boundary] OK - HVUT HVAA config bridge failures are persisted");
