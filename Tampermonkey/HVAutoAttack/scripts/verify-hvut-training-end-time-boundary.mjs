import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const diagnosticText = fs.readFileSync(path.join(root, diagnosticTarget), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const helperRegion =
  /var record_hvut_training_notification_failure = function \(stage, detail\) \{[\s\S]*?\n  var reloadCurrentPage/.exec(text)?.[0] || "";
const modernTable =
  /_tr\.parse_table = function \(\) \{[\s\S]*?\n  \};\n\n  _tr\.parse_progress/.exec(text)?.[0] || "";
const modernProgress =
  /_tr\.parse_progress = function \(\) \{[\s\S]*?\n  \};\n\n  GM_addStyle/.exec(text)?.[0] || "";
const bottomTraining =
  /_bottom\.tr = \{[\s\S]*?\n  \};\n\n  _bottom\.tr\.init\(\);/.exec(text)?.[0] || "";
const legacyTraining =
  /\$input\(\['button', 'Set'\][\s\S]*?\n\} else\n\/\/ \[END 4\] Character - Training/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["training notification helper", helperRegion],
  ["modern training table", modernTable],
  ["modern training progress", modernProgress],
  ["bottom training notification", bottomTraining],
  ["legacy training notification", legacyTraining],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

for (const required of [
  "sessionStorage.setItem('HVAA:lastHvutTrainingNotificationFailure', JSON.stringify(evidence));",
  "var parse_hvut_training_end_time = function (source, stage) {",
  "record_hvut_training_notification_failure(stage, { sourceType: typeof source });",
  "var parse_hvut_training_row = function (row, stage) {",
  "return record_hvut_training_notification_failure(stage, { name: name, text: row?.textContent || '' });",
  "var classify_hvut_training_notification_response = function (doc, stage, detail) {",
  "record_hvut_training_notification_failure(stage, { ...detail, reason: 'rejectedResponse', error: error });",
  "return { kind: 'rejected', reason: 'rejectedResponse', message: error };",
  "return { kind: 'accepted' };",
]) {
  requirePart("training notification helper", helperRegion, required);
}

for (const required of [
  "let parseFailed = false;",
  "const row = parse_hvut_training_row(tr, 'trainingTableRow');",
  "parseFailed = true;",
  "const { name, enName, time, level, max } = row;",
  "if (parseFailed) return false;",
]) {
  requirePart("modern training table", modernTable, required);
}

for (const required of [
  "const current_end = parse_hvut_training_end_time(_window.end_time, 'trainingPageWindowEndTime');",
  "if (current_end === null) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "_tr.json.current_end = current_end;",
]) {
  requirePart("modern training progress", modernProgress, required);
}

for (const required of [
  "const current_end = parse_hvut_training_end_time(html, 'bottomTrainingHtmlEndTime');",
  "if (current_end === null) {",
  "json.error = '解析训练倒计时失败';",
  "_bottom.tr.node.link.textContent = json.error;",
  "return false;",
  "json.current_end = current_end;",
  "const response = classify_hvut_training_notification_response(doc, 'bottomTrainingStartResponse'",
  "if (response.kind === 'rejected') {",
  "json.error = response.message;",
]) {
  requirePart("bottom training notification", bottomTraining, required);
}

for (const required of [
  "const current_end = parse_hvut_training_end_time(_window.end_time, 'legacyTrainingPageWindowEndTime');",
  "if (current_end === null) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "_tr.json.current_end = current_end;",
]) {
  requirePart("legacy training notification", legacyTraining, required);
}
for (const required of [
  "let parseFailed = false;",
  "const row = parse_hvut_training_row(tr, 'legacyTrainingTableRow');",
  "parseFailed = true;",
  "const { name, enName, time, level, max } = row;",
  "if (parseFailed) return false;",
]) {
  requirePart("legacy training notification", legacyTraining, required);
}

for (const forbidden of [
  "json.current_end = /var end_time = (\\d+);/.exec(html)[1] * 1000;",
  "_tr.json.current_end = _window.end_time * 1000;",
  "const name = tr.cells[0].textContent.trim();",
  "const enName = resolveEn(tr.cells[0], 'trains') ?? name;",
  "const time = parseFloat(tr.cells[3].textContent);",
  "const level = parseInt(tr.cells[4].textContent);",
  "const max = parseInt(tr.cells[6].textContent);",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked training end-time path: ${forbidden}`);
  }
}
if (bottomTraining.includes("const error = get_message(doc);")) {
  violations.push(`${target} bottom training notification must classify start responses through classify_hvut_training_notification_response`);
}
if (bottomTraining.includes("json.error = error;")) {
  violations.push(`${target} bottom training notification must use typed response message`);
}

for (const required of [
  'HVUT_TRAINING_NOTIFICATION_FAILURE: "HVAA:lastHvutTrainingNotificationFailure"',
  'source("hvutTrainingNotificationFailure", DiagnosticEvidenceKey.HVUT_TRAINING_NOTIFICATION_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-training-end-time-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-training-end-time-boundary] OK - training end-time parse failures fail closed with evidence");
