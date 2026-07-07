import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvUtilsFile = path.join(root, "src/i18n/hv-utils.js");
const diagnosticKeysFile = path.join(root, "src/core/diagnostic-evidence-keys.js");
const diagnosticTestFile = path.join(root, "src/core/diagnostic-evidence.test.js");

const hvUtilsText = fs.readFileSync(hvUtilsFile, "utf8");
const diagnosticKeysText = fs.readFileSync(diagnosticKeysFile, "utf8");
const diagnosticTestText = fs.readFileSync(diagnosticTestFile, "utf8");
const violations = [];

for (const required of [
  "HVUT_RUNTIME_FAILURE_KEY = 'HVAA:lastHvutRuntimeFailure'",
  "capability: 'hvutRuntime'",
  "stage: stage || 'executeHvUtils'",
  "page: location.href",
  "name: error && error.name",
  "msg: hvut_runtime_error_text(error)",
  "stack: error && error.stack ? error.stack : String(error)",
  "sessionStorage.setItem(HVUT_RUNTIME_FAILURE_KEY, JSON.stringify(evidence))",
  "console.error('[HVAA][HVUT] runtime failed', evidence)",
  "render_hvut_runtime_failure_log",
  "show_hvut_runtime_failure_report",
  "[HVAA][HVUT] 执行出错，请整段复制此日志反馈",
  "× 关闭 HVUT 诊断",
]) {
  if (!hvUtilsText.includes(required)) {
    violations.push(`src/i18n/hv-utils.js must keep HVUT runtime diagnostic evidence: ${required}`);
  }
}

if (hvUtilsText.includes("[HVAA][i18n] 汉化执行出错，请整段复制此日志反馈")) {
  violations.push("src/i18n/hv-utils.js must not label top-level HVUT runtime failures as i18n-only failures");
}

for (const required of [
  'HVUT_RUNTIME_FAILURE: "HVAA:lastHvutRuntimeFailure"',
  'source("hvutRuntimeFailure", DiagnosticEvidenceKey.HVUT_RUNTIME_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`src/core/diagnostic-evidence-keys.js must expose ${required}`);
  }
}

for (const required of [
  "HVAA:lastHvutRuntimeFailure",
  "hvutRuntimeFailure",
  'capability: "hvutRuntime"',
  'stage: "executeHvUtils"',
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`src/core/diagnostic-evidence.test.js must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-runtime-failure-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-runtime-failure-boundary] OK - HVUT runtime failures are diagnosable");
