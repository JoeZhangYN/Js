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
const modernUpdate =
  /update: async function \(mail, post\) \{[\s\S]*?\n      \},\n      modify: function/.exec(text)?.[0] || "";
const legacyRead =
  /_mm\.mail_read = async function \(mid, post, season = _mm\.db\.season\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_load/.exec(text)?.[0] || "";
const legacyLoad =
  /_mm\.mail_load = async function \(mid, post\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_parse/.exec(text)?.[0] || "";
const legacyUpdate =
  /_mm\.mail_update = async function \(mail, post\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_modify/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["modern MoogleMail read", modernRead],
  ["modern MoogleMail load", modernLoad],
  ["modern MoogleMail update", modernUpdate],
  ["legacy MoogleMail read", legacyRead],
  ["legacy MoogleMail load", legacyLoad],
  ["legacy MoogleMail update", legacyUpdate],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

for (const required of [
  "var record_hvut_mooglemail_action_failure = function (stage, detail) {",
  "capability: 'hvutMoogleMailAction'",
  "sessionStorage.setItem('HVAA:lastHvutMoogleMailActionFailure'",
  "var create_hvut_mooglemail_parse_evidence = function (stage, detail) {",
  "var wait_hvut_mooglemail_db_write = function (stage, detail, conn) {",
  "var classify_hvut_mooglemail_view_response = function (doc, stage) {",
  "return { kind: 'rejected', reason: 'viewResponseMessageMissing', error: '未知错误', evidence: evidence };",
  "return { kind: 'rejected', reason: 'mailError', error: message, evidence: evidence };",
  "conn.tx.oncomplete = function () {\n          resolve(true);",
  "conn.tx.onerror = function (event) {",
  "conn.tx.onabort = function (event) {",
]) {
  if (!text.includes(required)) violations.push(`${target} must define MoogleMail action evidence with ${required}`);
}

for (const required of [
  "const loadResponse = await _mm.mail.load(mid, post);",
  "if (loadResponse.kind === 'rejected') {",
  "_mm.mail.view(mail);",
  "return false;",
]) {
  requirePart("modern MoogleMail read", modernRead, required);
}

for (const required of [
  "try {\n          html = await $ajax.fetch(`?s=Bazaar&ss=mm&mid=${mid}`, post);",
  "const evidence = record_hvut_mooglemail_action_failure(stage, { mid: mid, post: post || '', error: error?.message || String(error) });",
  "mail.view = { error: post ? '邮件动作请求失败' : '读取邮件失败' };",
  "return { kind: 'rejected', reason: 'requestFailed', error: mail.view.error, evidence: evidence };",
  "const evidence = record_hvut_mooglemail_action_failure(post ? 'viewActionRejected' : 'viewLoadRejected'",
  "return { kind: 'rejected', reason: 'responseRejected', error: mail.view.error, evidence: evidence };",
  "if (!await _mm.mail.update(mail, post)) {",
  "mail.view = { ...mail.view, error: post ? '邮件动作保存失败' : '邮件缓存保存失败' };",
  "const evidence = record_hvut_mooglemail_action_failure(post ? 'viewActionCacheWriteRejected' : 'viewLoadCacheWriteRejected'",
  "return { kind: 'rejected', reason: 'cacheWriteFailed', error: mail.view.error, evidence: evidence };",
  "return { kind: 'accepted' };",
]) {
  requirePart("modern MoogleMail load", modernLoad, required);
}

for (const required of [
  "let conn = null;",
  "let applyWrite = null;",
  "const nextDb = { ...db, filter: view.filter, user: view.user, subject: view.subject, text: view.text, sent: sent, read: read };",
  "writeStage = post ? 'viewActionDbUpdate' : 'viewLoadDbUpdate';",
  "writeDetail = { mid: mid, post: post || '', operation: 'put' };",
  "conn.os.put(nextDb);",
  "record_hvut_mooglemail_action_failure(writeStage, { ...writeDetail, error: error?.message || String(error) });",
  "applyWrite = function () {\n              Object.assign(db, nextDb);\n            };",
  "writeStage = post ? 'viewActionDbInsert' : 'viewLoadDbInsert';",
  "writeDetail = { mid: mid, post: post || '', operation: 'add' };",
  "conn.os.add(db);",
  "applyWrite = function () {\n            mail.db = db;\n          };",
  "if (conn && !await wait_hvut_mooglemail_db_write(writeStage, writeDetail, conn)) {",
  "return false;",
  "if (applyWrite) {\n          applyWrite();\n        }",
  "_mm.mail.modify(mail);",
  "return true;",
]) {
  requirePart("modern MoogleMail update", modernUpdate, required);
}

for (const required of [
  "const loadResponse = await _mm.mail_load(mid, post);",
  "if (loadResponse.kind === 'rejected') {",
  "_mm.mail_view(mail);",
  "return false;",
]) {
  requirePart("legacy MoogleMail read", legacyRead, required);
}

for (const required of [
  "try {\n        html = await $ajax.fetch('?s=Bazaar&ss=mm&mid=' + mid, post);",
  "const evidence = record_hvut_mooglemail_action_failure(stage, { mid: mid, post: post || '', error: error?.message || String(error) });",
  "mail.view = { error: post ? '邮件动作请求失败' : '读取邮件失败' };",
  "return { kind: 'rejected', reason: 'requestFailed', error: mail.view.error, evidence: evidence };",
  "const evidence = record_hvut_mooglemail_action_failure(post ? 'legacyViewActionRejected' : 'legacyViewLoadRejected'",
  "return { kind: 'rejected', reason: 'responseRejected', error: mail.view.error, evidence: evidence };",
  "if (!await _mm.mail_update(mail, post)) {",
  "mail.view = { ...mail.view, error: post ? '邮件动作保存失败' : '邮件缓存保存失败' };",
  "const evidence = record_hvut_mooglemail_action_failure(post ? 'legacyViewActionCacheWriteRejected' : 'legacyViewLoadCacheWriteRejected'",
  "return { kind: 'rejected', reason: 'cacheWriteFailed', error: mail.view.error, evidence: evidence };",
  "return { kind: 'accepted' };",
]) {
  requirePart("legacy MoogleMail load", legacyLoad, required);
}

for (const required of [
  "let conn = null;",
  "let applyWrite = null;",
  "const nextDb = { ...db, filter: view.filter, user: view.user, subject: view.subject, text: view.text, sent: sent, read: read };",
  "writeStage = post ? 'legacyViewActionDbUpdate' : 'legacyViewLoadDbUpdate';",
  "writeDetail = { mid: mid, post: post || '', operation: 'put' };",
  "conn.os.put(nextDb);",
  "record_hvut_mooglemail_action_failure(writeStage, { ...writeDetail, error: error?.message || String(error) });",
  "applyWrite = function () {\n            Object.assign(db, nextDb);\n          };",
  "writeStage = post ? 'legacyViewActionDbInsert' : 'legacyViewLoadDbInsert';",
  "writeDetail = { mid: mid, post: post || '', operation: 'add' };",
  "conn.os.add(db);",
  "applyWrite = function () {\n          mail.db = db;\n        };",
  "if (conn && !await wait_hvut_mooglemail_db_write(writeStage, writeDetail, conn)) {",
  "return false;",
  "if (applyWrite) {\n        applyWrite();\n      }",
  "_mm.mail_modify(mail);",
  "return true;",
]) {
  requirePart("legacy MoogleMail update", legacyUpdate, required);
}

for (const forbidden of [
  "const html = await $ajax.fetch(`?s=Bazaar&ss=mm&mid=${mid}`, post);",
  "const html = await $ajax.fetch('?s=Bazaar&ss=mm&mid=' + mid, post);",
  "await _mm.mail.load(mid, post);\n        }\n        _mm.mail.view(mail);",
  "await _mm.mail_load(mid, post);\n      }\n      _mm.mail_view(mail);",
  "if (!await _mm.mail.load(mid, post)) {",
  "if (!await _mm.mail_load(mid, post)) {",
  "if (!mail.view?.error && !await _mm.mail.update(mail, post)) {",
  "if (!mail.view?.error && !await _mm.mail_update(mail, post)) {",
  "return !mail.view?.error;",
  "_mm.mail.update(mail);\n        return !mail.view?.error;",
  "_mm.mail_update(mail);\n      return !mail.view?.error;",
  "update: function (mail) {",
  "_mm.mail_update = function (mail) {",
  "db.filter = view.filter;\n            db.user = view.user;",
  "mail.db = { mid: mid, filter: view.filter",
  "view.error = get_message(doc) || '未知错误';",
  "classify_hvut_mooglemail_view_response(doc, 'viewRejectedResponse').error",
  "classify_hvut_mooglemail_view_response(doc, 'legacyViewRejectedResponse').error",
  "return { kind: 'rejected', reason: 'viewResponseMessageMissing', error: '未知错误' };",
  "return { kind: 'rejected', reason: 'mailError', error: message };",
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
