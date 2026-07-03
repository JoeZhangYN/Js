import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const keysText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence-keys.js"), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence.test.js"), "utf8");
const violations = [];

for (const required of [
  "var record_hvut_mooglemail_send_failure = function (stage, detail) {",
  "sessionStorage.setItem('HVAA:lastHvutMoogleMailSendFailure'",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must define MoogleMail send evidence with ${required}`);
  }
}

const sendMatch = /\$mail\.log\('\\n========== Sending =========='\);[\s\S]*?\n  \},\n  chunk: function/.exec(text);

if (!sendMatch) {
  violations.push(`${target} must keep the MoogleMail send entry visible`);
} else {
  const body = sendMatch[0];
  const attachMatch = /if \(attach\?\.length\) \{[\s\S]*?\n    \}\n\n    if \(cod && !cod_persistent\)/.exec(body);
  if (!attachMatch) {
    violations.push(`${target} must keep the MoogleMail attach stage visible`);
  }
  const attachBody = attachMatch?.[0] || "";
  for (const required of [
    "let results;",
    "try {\n        results = await Promise.all(requests);",
    "catch (error) {\n        record_hvut_mooglemail_send_failure('attachRequest'",
    "await $mail.discard();",
    "catch (discardError) {\n          record_hvut_mooglemail_send_failure('attachRequestDiscard'",
    "return false;",
    "if (!results.every((r) => r)) {",
    "record_hvut_mooglemail_send_failure('attachRejected'",
    "record_hvut_mooglemail_send_failure('attachRejectedDiscard'",
  ]) {
    if (!attachBody.includes(required)) {
      violations.push(`${target} mail attach must guard failure with ${required}`);
    }
  }
  if (/const results = await Promise\.all\(requests\);\n\s*if \(!results\.every/.test(attachBody)) {
    violations.push(`${target} mail attach must not continue after unchecked Promise.all`);
  }
  if (/\$mail\.discard\(\);\n\s*return;/.test(attachBody)) {
    violations.push(`${target} mail attach must await discard and return false`);
  }
  if (/catch \(_error\) \{\n\s*\$mail\.log\(`#\$\{index\}: !!! Error: Attachment request failed`\);/.test(attachBody)) {
    violations.push(`${target} mail attach must not keep untyped attach request failure`);
  }
}

for (const required of [
  'HVUT_MOOGLEMAIL_SEND_FAILURE: "HVAA:lastHvutMoogleMailSendFailure"',
  'source("hvutMoogleMailSendFailure", DiagnosticEvidenceKey.HVUT_MOOGLEMAIL_SEND_FAILURE)',
]) {
  if (!keysText.includes(required)) violations.push(`diagnostic evidence keys must include ${required}`);
}

if (!diagnosticTestText.includes("HVAA:lastHvutMoogleMailSendFailure")) {
  violations.push("diagnostic-evidence.test.js must cover HVUT MoogleMail send evidence");
}

if (violations.length) {
  console.error("[verify-hvut-mail-attach-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mail-attach-boundary] OK - MoogleMail attach failures fail closed");
