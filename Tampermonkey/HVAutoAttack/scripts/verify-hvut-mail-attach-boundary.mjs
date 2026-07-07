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
  "var stop_hvut_mooglemail_send_failure = async function (stage, detail, message, discardStage) {",
  "var classify_hvut_mooglemail_send_response = function (html, stage, detail) {",
  "var classify_hvut_mooglemail_attach_response = function (html, stage, detail) {",
  "return classify_hvut_mooglemail_send_response(html, stage, detail);",
  "record_hvut_mooglemail_send_failure(stage, { ...detail, reason: 'emptyResponse' });",
  "return { kind: 'rejected', reason: 'emptyResponse', evidence: evidence };",
  "var error = get_message($doc(html));",
  "var evidence = record_hvut_mooglemail_send_failure(stage, { ...detail, reason: 'mailError', error: error });",
  "$mail.error = error;",
  "$mail.log('!!! Error: ' + error);",
  "return { kind: 'rejected', reason: 'mailError', error: error, evidence: evidence };",
  "return { kind: 'accepted' };",
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
  const stopHelperMatch = /var stop_hvut_mooglemail_send_failure = async function \(stage, detail, message, discardStage\) \{[\s\S]*?\n  \};/.exec(text);
  const stopHelperBody = stopHelperMatch?.[0] || "";
  for (const required of [
    "record_hvut_mooglemail_send_failure(stage, detail);",
    "await $mail.discard();",
    "record_hvut_mooglemail_send_failure(discardStage",
    "$mail.ready = true;",
    "return false;",
  ]) {
    if (!stopHelperBody.includes(required)) {
      violations.push(`${target} MoogleMail stop helper must preserve failure semantics with ${required}`);
    }
  }
  if (/return (?:false|undefined|null);[\s\S]{0,80}\n\s*\};/.test(stopHelperBody) && !stopHelperBody.includes("$mail.ready = true;")) {
    violations.push(`${target} MoogleMail stop helper must release ready before returning`);
  }
  for (const required of [
    "return stop_hvut_mooglemail_send_failure('mailboxLoadRequest'",
    "return stop_hvut_mooglemail_send_failure('mailboxToken'",
    "return stop_hvut_mooglemail_send_failure('mailboxInitialDiscard'",
    "return stop_hvut_mooglemail_send_failure('codRequest'",
    "return stop_hvut_mooglemail_send_failure('codRejected'",
    "return stop_hvut_mooglemail_send_failure('persistentMailboxLoadRequest'",
    "return stop_hvut_mooglemail_send_failure('persistentMailboxRejected'",
    "return stop_hvut_mooglemail_send_failure('persistentMailboxUnavailable'",
    "return stop_hvut_mooglemail_send_failure('persistentMailboxDirty'",
    "return stop_hvut_mooglemail_send_failure('persistentAttachRequest'",
    "return stop_hvut_mooglemail_send_failure('persistentAttachRejected'",
    "return stop_hvut_mooglemail_send_failure('persistentCodRequest'",
    "return stop_hvut_mooglemail_send_failure('persistentCodRejected'",
    "return stop_hvut_mooglemail_send_failure('persistentSendRequest'",
    "return stop_hvut_mooglemail_send_failure('persistentSendRejected'",
    "return stop_hvut_mooglemail_send_failure('sendRequest'",
    "return stop_hvut_mooglemail_send_failure('sendRejected'",
    "const response = classify_hvut_mooglemail_send_response(html, 'codResponse'",
    "const mailboxResponse = classify_hvut_mooglemail_send_response(html, 'persistentMailboxResponse'",
    "const persistentAttachResponse = classify_hvut_mooglemail_send_response(html, 'persistentAttachResponse'",
    "const persistentCodResponse = classify_hvut_mooglemail_send_response(html, 'persistentCodResponse'",
    "const persistentSendResponse = classify_hvut_mooglemail_send_response(html, 'persistentSendResponse'",
    "const sendResponse = classify_hvut_mooglemail_send_response(html, 'sendResponse'",
    "if (response.kind === 'rejected') {",
    "if (mailboxResponse.kind === 'rejected') {",
    "if (persistentAttachResponse.kind === 'rejected') {",
    "if (persistentCodResponse.kind === 'rejected') {",
    "if (persistentSendResponse.kind === 'rejected') {",
    "if (sendResponse.kind === 'rejected') {",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} mail send must guard failure with ${required}`);
    }
  }
  if (/\$mail\.discard\(\);\n\s*return;/.test(body)) {
    violations.push(`${target} mail send must not keep naked discard/return failure paths`);
  }
  if (body.includes("$mail.check(html)")) {
    violations.push(`${target} mail send must classify responses through classify_hvut_mooglemail_send_response`);
  }
  if (text.includes("check: function (html) {")) {
    violations.push(`${target} mail send must not keep $mail.check as a parallel response classifier`);
  }
  if (text.includes("return { kind: 'rejected', reason: 'mailError', error: error };")) {
    violations.push(`${target} mail send rejected outcome must preserve evidence`);
  }
  const attachMatch = /if \(attach\?\.length\) \{[\s\S]*?\n    \}\n\n    if \(cod && !cod_persistent\)/.exec(body);
  if (!attachMatch) {
    violations.push(`${target} must keep the MoogleMail attach stage visible`);
  }
  const attachBody = attachMatch?.[0] || "";
  for (const required of [
    "let results;",
    "try {\n        results = await Promise.all(requests);",
    "catch (error) {\n        return stop_hvut_mooglemail_send_failure('attachRequest'",
    "'attachRequestDiscard'",
    "const response = classify_hvut_mooglemail_attach_response(html, 'attachEmptyResponse'",
    "if (response.kind === 'rejected') {",
    "return response;",
    "if (!results.every((r) => r.kind === 'accepted')) {",
    "return stop_hvut_mooglemail_send_failure('attachRejected'",
    "'attachRejectedDiscard'",
  ]) {
    if (!attachBody.includes(required)) {
      violations.push(`${target} mail attach must guard failure with ${required}`);
    }
  }
  if (/const results = await Promise\.all\(requests\);\n\s*if \(!results\.every/.test(attachBody)) {
    violations.push(`${target} mail attach must not continue after unchecked Promise.all`);
  }
  if (attachBody.includes("$mail.check(html)")) {
    violations.push(`${target} mail attach must classify attach responses through classify_hvut_mooglemail_attach_response`);
  }
  if (/return true;/.test(attachBody)) {
    violations.push(`${target} mail attach must return typed attach decisions instead of boolean success`);
  }
  if (/\$mail\.discard\(\);\n\s*return;/.test(attachBody)) {
    violations.push(`${target} mail attach must await discard and return false`);
  }
  if (/catch \(_error\) \{\n\s*\$mail\.log\(`#\$\{index\}: !!! Error: Attachment request failed`\);/.test(attachBody)) {
    violations.push(`${target} mail attach must not keep untyped attach request failure`);
  }
  if (/record_hvut_mooglemail_send_failure\('attach(?:Request|Rejected)'/.test(attachBody)) {
    violations.push(`${target} mail attach failures must route through stop_hvut_mooglemail_send_failure`);
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
