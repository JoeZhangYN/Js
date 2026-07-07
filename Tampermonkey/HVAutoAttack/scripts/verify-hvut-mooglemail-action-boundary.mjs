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
const modernView =
  /view: function \(mail\) \{[\s\S]*?\n      \},\n      close: function/.exec(text)?.[0] || "";
const legacyRead =
  /_mm\.mail_read = async function \(mid, post, season = _mm\.db\.season\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_load/.exec(text)?.[0] || "";
const legacyLoad =
  /_mm\.mail_load = async function \(mid, post\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_parse/.exec(text)?.[0] || "";
const legacyUpdate =
  /_mm\.mail_update = async function \(mail, post\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_modify/.exec(text)?.[0] || "";
const legacyView =
  /_mm\.mail_view = function \(mail\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_click/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["modern MoogleMail read", modernRead],
  ["modern MoogleMail load", modernLoad],
  ["modern MoogleMail update", modernUpdate],
  ["modern MoogleMail view", modernView],
  ["legacy MoogleMail read", legacyRead],
  ["legacy MoogleMail load", legacyLoad],
  ["legacy MoogleMail update", legacyUpdate],
  ["legacy MoogleMail view", legacyView],
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
  "var render_hvut_mooglemail_view_attach_list = function (mail, div, db, context) {",
  "mail.attach = [];",
  "const ul = $element('ul', div, null, { input: context.onInput });",
  "codText = db.read ? `CoD Paid: ${db.cod.toLocaleString()}` : `CoD: ${db.cod.toLocaleString()}`;",
  "codText = context.noCodText;",
  "create_hvut_equip_page_url({ eid: e.e, key: e.k })",
  "e.node.price = $input('text', li, { className: 'hvut-mm-price' });",
  "var create_hvut_mooglemail_cache_write_plan = function (mail, post, context) {",
  "if (view.error) return null;",
  "const nextDb = { ...db, filter: view.filter, user: view.user, subject: view.subject, text: view.text, sent: sent, read: read };",
  "operation: 'put',",
  "stage: post ? context.actionUpdateStage : context.loadUpdateStage,",
  "operation: 'add',",
  "stage: post ? context.actionInsertStage : context.loadInsertStage,",
  "apply: function () {",
  "var run_hvut_mooglemail_cache_write_plan = async function (writePlan, db) {",
  "if (!writePlan) return true;",
  "const conn = db.conn('readwrite');",
  "if (writePlan.operation === 'put') {",
  "conn.os.put(writePlan.value);",
  "conn.os.add(writePlan.value);",
  "record_hvut_mooglemail_action_failure(writePlan.stage, { ...writePlan.detail, error: error?.message || String(error) });",
  "if (!await wait_hvut_mooglemail_db_write(writePlan.stage, writePlan.detail, conn)) {",
  "writePlan.apply();",
  "var run_hvut_mooglemail_view_load = async function (mid, post, context) {",
  "const mail = context.get(mid);",
  "html = await $ajax.fetch(create_hvut_mail_view_url(mid), post);",
  "const stage = post ? context.actionRequestStage : context.loadRequestStage;",
  "mail.view = context.parse(html);",
  "post ? context.actionRejectedStage : context.loadRejectedStage",
  "if (!await context.update(mail, post)) {",
  "post ? context.actionCacheWriteRejectedStage : context.loadCacheWriteRejectedStage",
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
  "return run_hvut_mooglemail_view_load(mid, post, {",
  "get: _mm.mail.get,",
  "parse: _mm.mail.parse,",
  "update: _mm.mail.update,",
  "actionRequestStage: 'viewActionRequest',",
  "loadRequestStage: 'viewLoadRequest',",
  "actionRejectedStage: 'viewActionRejected',",
  "loadRejectedStage: 'viewLoadRejected',",
  "actionCacheWriteRejectedStage: 'viewActionCacheWriteRejected',",
  "loadCacheWriteRejectedStage: 'viewLoadCacheWriteRejected',",
]) {
  requirePart("modern MoogleMail load", modernLoad, required);
}

for (const required of [
  "const writePlan = create_hvut_mooglemail_cache_write_plan(mail, post, {",
  "actionUpdateStage: 'viewActionDbUpdate',",
  "loadUpdateStage: 'viewLoadDbUpdate',",
  "actionInsertStage: 'viewActionDbInsert',",
  "loadInsertStage: 'viewLoadDbInsert',",
  "if (!await run_hvut_mooglemail_cache_write_plan(writePlan, _mm.db)) return false;",
  "return false;",
  "_mm.mail.modify(mail);",
  "return true;",
]) {
  requirePart("modern MoogleMail update", modernUpdate, required);
}

for (const required of [
  "render_hvut_mooglemail_view_attach_list(mail, div, db, {",
  "noCodText: '无货到付款',",
  "onInput: (e) => { _mm.mail.cod(e); },",
]) {
  requirePart("modern MoogleMail view", modernView, required);
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
  "return run_hvut_mooglemail_view_load(mid, post, {",
  "get: _mm.mail_get,",
  "parse: _mm.mail_parse,",
  "update: _mm.mail_update,",
  "actionRequestStage: 'legacyViewActionRequest',",
  "loadRequestStage: 'legacyViewLoadRequest',",
  "actionRejectedStage: 'legacyViewActionRejected',",
  "loadRejectedStage: 'legacyViewLoadRejected',",
  "actionCacheWriteRejectedStage: 'legacyViewActionCacheWriteRejected',",
  "loadCacheWriteRejectedStage: 'legacyViewLoadCacheWriteRejected',",
]) {
  requirePart("legacy MoogleMail load", legacyLoad, required);
}

for (const required of [
  "const writePlan = create_hvut_mooglemail_cache_write_plan(mail, post, {",
  "actionUpdateStage: 'legacyViewActionDbUpdate',",
  "loadUpdateStage: 'legacyViewLoadDbUpdate',",
  "actionInsertStage: 'legacyViewActionDbInsert',",
  "loadInsertStage: 'legacyViewLoadDbInsert',",
  "if (!await run_hvut_mooglemail_cache_write_plan(writePlan, _mm.db)) return false;",
  "return false;",
  "_mm.mail_modify(mail);",
  "return true;",
]) {
  requirePart("legacy MoogleMail update", legacyUpdate, required);
}

for (const required of [
  "render_hvut_mooglemail_view_attach_list(mail, div, db, {",
  "noCodText: 'No CoD',",
  "onInput: (e) => { _mm.mail_cod(e); },",
]) {
  requirePart("legacy MoogleMail view", legacyView, required);
}

for (const forbidden of [
  "html = await $ajax.fetch(`?s=Bazaar&ss=mm&mid=${mid}`, post);",
  "html = await $ajax.fetch('?s=Bazaar&ss=mm&mid=' + mid, post);",
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
  "writeStage = post ? 'viewActionDbUpdate' : 'viewLoadDbUpdate';",
  "writeStage = post ? 'legacyViewActionDbUpdate' : 'legacyViewLoadDbUpdate';",
  "writeDetail = { mid: mid, post: post || '', operation: 'put' };",
  "writeDetail = { mid: mid, post: post || '', operation: 'add' };",
  "view.error = get_message(doc) || '未知错误';",
  "classify_hvut_mooglemail_view_response(doc, 'viewRejectedResponse').error",
  "classify_hvut_mooglemail_view_response(doc, 'legacyViewRejectedResponse').error",
  "return { kind: 'rejected', reason: 'viewResponseMessageMissing', error: '未知错误' };",
  "return { kind: 'rejected', reason: 'mailError', error: message };",
]) {
  if (text.includes(forbidden)) violations.push(`${target} must not keep unchecked MoogleMail action path: ${forbidden}`);
}

for (const [label, body] of [
  ["modern MoogleMail load", modernLoad],
  ["legacy MoogleMail load", legacyLoad],
]) {
  for (const forbidden of [
    "html = await $ajax.fetch(create_hvut_mail_view_url(mid), post);",
    "record_hvut_mooglemail_action_failure(stage, { mid: mid, post: post || '', error: error?.message || String(error) });",
    "return { kind: 'rejected', reason: 'requestFailed', error: mail.view.error, evidence: evidence };",
    "return { kind: 'rejected', reason: 'responseRejected', error: mail.view.error, evidence: evidence };",
    "return { kind: 'rejected', reason: 'cacheWriteFailed', error: mail.view.error, evidence: evidence };",
    "return { kind: 'accepted' };",
    "mail.view = { ...mail.view, error: post ? '邮件动作保存失败' : '邮件缓存保存失败' };",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} ${label} must delegate view load result classification to run_hvut_mooglemail_view_load`);
    }
  }
}

for (const [label, body] of [
  ["modern MoogleMail update", modernUpdate],
  ["legacy MoogleMail update", legacyUpdate],
]) {
  for (const forbidden of [
    "const nextDb = { ...db, filter: view.filter, user: view.user, subject: view.subject, text: view.text, sent: sent, read: read };",
    "const db = { mid: mid, filter: view.filter, user: view.user, subject: view.subject, text: view.text, sent: page.sent, read: page.read };",
    "let read = page?.read || db.read;",
    "if (view.returned) {\n            nextDb.returned = 1;",
    "if (view.attach.length) {",
    "if (view.cod) {",
    "if (writePlan.operation === 'put') {",
    "conn.os.put(writePlan.value);",
    "conn.os.add(writePlan.value);",
    "record_hvut_mooglemail_action_failure(writePlan.stage, { ...writePlan.detail, error: error?.message || String(error) });",
    "wait_hvut_mooglemail_db_write(writePlan.stage, writePlan.detail, conn)",
    "writePlan.apply();",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} ${label} must delegate cache write planning/execution to MoogleMail cache write entries`);
    }
  }
}

for (const [label, body] of [
  ["modern MoogleMail view", modernView],
  ["legacy MoogleMail view", legacyView],
]) {
  for (const forbidden of [
    "mail.attach = [];",
    "const ul = $element('ul', div, null, { input:",
    "mail.attach = JSON.parse(JSON.stringify(db.attach));",
    "mail.attach.forEach((e) => {",
    "create_hvut_equip_page_url({ eid: e.e, key: e.k })",
    "e.node.price = $input('text', li, { className: 'hvut-mm-price' });",
    "e.node.cod = $input('text', li, { className: 'hvut-mm-cod', readOnly: true });",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} ${label} must delegate attachment rendering to render_hvut_mooglemail_view_attach_list`);
    }
  }
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
