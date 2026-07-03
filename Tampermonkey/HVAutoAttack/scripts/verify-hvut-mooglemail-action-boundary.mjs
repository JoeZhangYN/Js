import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const keysText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence-keys.js"), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence.test.js"), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const modernRead =
  /read: async function \(mid, post, season = _mm\.db\.season\) \{[\s\S]*?\n      \},\n      load: async function/.exec(text)?.[0] || "";
const modernLoad =
  /load: async function \(mid, post\) \{[\s\S]*?\n      \},\n      parse: function/.exec(text)?.[0] || "";
const legacyRead =
  /_mm\.mail_read = async function \(mid, post, season = _mm\.db\.season\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_load/.exec(text)?.[0] || "";
const legacyLoad =
  /_mm\.mail_load = async function \(mid, post\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_parse/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["modern MoogleMail read", modernRead],
  ["modern MoogleMail load", modernLoad],
  ["legacy MoogleMail read", legacyRead],
  ["legacy MoogleMail load", legacyLoad],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

for (const required of [
  "var record_hvut_mooglemail_action_failure = function (stage, detail) {",
  "capability: 'hvutMoogleMailAction'",
  "sessionStorage.setItem('HVAA:lastHvutMoogleMailActionFailure'",
]) {
  if (!text.includes(required)) violations.push(`${target} must define MoogleMail action evidence with ${required}`);
}

for (const required of [
  "if (!await _mm.mail.load(mid, post)) {",
  "_mm.mail.view(mail);",
  "return false;",
]) {
  requirePart("modern MoogleMail read", modernRead, required);
}

for (const required of [
  "try {\n          html = await $ajax.fetch(`?s=Bazaar&ss=mm&mid=${mid}`, post);",
  "record_hvut_mooglemail_action_failure(stage, { mid: mid, post: post || '', error: error?.message || String(error) });",
  "mail.view = { error: post ? '邮件动作请求失败' : '读取邮件失败' };",
  "record_hvut_mooglemail_action_failure(post ? 'viewActionRejected' : 'viewLoadRejected'",
  "return !mail.view?.error;",
]) {
  requirePart("modern MoogleMail load", modernLoad, required);
}

for (const required of [
  "if (!await _mm.mail_load(mid, post)) {",
  "_mm.mail_view(mail);",
  "return false;",
]) {
  requirePart("legacy MoogleMail read", legacyRead, required);
}

for (const required of [
  "try {\n        html = await $ajax.fetch('?s=Bazaar&ss=mm&mid=' + mid, post);",
  "record_hvut_mooglemail_action_failure(stage, { mid: mid, post: post || '', error: error?.message || String(error) });",
  "mail.view = { error: post ? '邮件动作请求失败' : '读取邮件失败' };",
  "record_hvut_mooglemail_action_failure(post ? 'legacyViewActionRejected' : 'legacyViewLoadRejected'",
  "return !mail.view?.error;",
]) {
  requirePart("legacy MoogleMail load", legacyLoad, required);
}

for (const forbidden of [
  "const html = await $ajax.fetch(`?s=Bazaar&ss=mm&mid=${mid}`, post);",
  "const html = await $ajax.fetch('?s=Bazaar&ss=mm&mid=' + mid, post);",
  "await _mm.mail.load(mid, post);\n        }\n        _mm.mail.view(mail);",
  "await _mm.mail_load(mid, post);\n      }\n      _mm.mail_view(mail);",
]) {
  if (text.includes(forbidden)) violations.push(`${target} must not keep unchecked MoogleMail action path: ${forbidden}`);
}

for (const required of [
  'HVUT_MOOGLEMAIL_ACTION_FAILURE: "HVAA:lastHvutMoogleMailActionFailure"',
  'source("hvutMoogleMailActionFailure", DiagnosticEvidenceKey.HVUT_MOOGLEMAIL_ACTION_FAILURE)',
]) {
  if (!keysText.includes(required)) violations.push(`diagnostic evidence keys must include ${required}`);
}

if (!diagnosticTestText.includes("HVAA:lastHvutMoogleMailActionFailure")) {
  violations.push("diagnostic-evidence.test.js must cover HVUT MoogleMail action evidence");
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-action-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mooglemail-action-boundary] OK - MoogleMail view actions fail closed with evidence");
