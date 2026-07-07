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
  /var create_hvut_mooglemail_parse_evidence = function \(stage, detail\) \{[\s\S]*?\n  var reloadCurrentPage/.exec(text)?.[0] || "";
const modernCredits =
  /_mm\.credits = \{[\s\S]*?\n    if \(_mm\.credits\.init\(\) === false\) \{[\s\S]*?\n    \}/.exec(text)?.[0] || "";
const legacyCredits =
  /_mm\.credits_list = \[\];[\s\S]*?\n    _mm\.credits_multi = function/.exec(text)?.[0] || "";
const mailParseBodies = [...text.matchAll(/parse: function \(html\) \{[\s\S]*?\n      \},\n      update: async function/g)].map((m) => m[0]);
const legacyMailParse =
  /_mm\.mail_parse = function \(arg\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_update/.exec(text)?.[0] || "";
const modernPagePager =
  /pager: function \(pager, p\) \{[\s\S]*?\n      \},\n      create: function/.exec(text)?.[0] || "";
const modernPageCreate =
  /create: function \(list, p\) \{[\s\S]*?\n      \},\n      modify: function/.exec(text)?.[0] || "";
const modernPageModify =
  /modify: function \(mail\) \{[\s\S]*?\n      \},\n      go: function/.exec(text)?.[0] || "";
const legacyPagePager =
  /_mm\.page_pager = function \(pager, p\) \{[\s\S]*?\n    \};\n\n    _mm\.page_create/.exec(text)?.[0] || "";
const legacyPageCreate =
  /_mm\.page_create = function \(list, p\) \{[\s\S]*?\n    \};\n\n    _mm\.page_modify/.exec(text)?.[0] || "";
const legacyPageModify =
  /_mm\.page_modify = function \(mail\) \{[\s\S]*?\n    \};\n\n    _mm\.page_go/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["MoogleMail parse helper", helperRegion],
  ["modern MoogleMail credits", modernCredits],
  ["legacy MoogleMail credits", legacyCredits],
  ["legacy MoogleMail parser", legacyMailParse],
  ["modern MoogleMail page pager", modernPagePager],
  ["modern MoogleMail page create", modernPageCreate],
  ["legacy MoogleMail page pager", legacyPagePager],
  ["legacy MoogleMail page create", legacyPageCreate],
  ["modern MoogleMail page modify", modernPageModify],
  ["legacy MoogleMail page modify", legacyPageModify],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

if (mailParseBodies.length !== 1) {
  violations.push(`${target} must keep one modern MoogleMail parser, found ${mailParseBodies.length}`);
}
const modernMailParse = mailParseBodies[0] || "";

for (const required of [
  "var create_hvut_mooglemail_parse_evidence = function (stage, detail) {",
  "sessionStorage.setItem('HVAA:lastHvutMoogleMailParseFailure', JSON.stringify(evidence));",
  "return evidence;",
  "var record_hvut_mooglemail_parse_failure = function (stage, detail) {",
  "create_hvut_mooglemail_parse_evidence(stage, detail);",
  "return null;",
  "var parse_hvut_mooglemail_count = function (text, pattern, stage) {",
  "record_hvut_mooglemail_parse_failure(stage, { text: text || '' });",
  "var parse_hvut_mooglemail_page_href = function (link, stage) {",
  "if (!link) return null;",
  "record_hvut_mooglemail_parse_failure(stage, { href: href });",
  "var update_hvut_mooglemail_page_window = function (state, pager, page, context) {",
  "const prev = parse_hvut_mooglemail_page_href(pager?.children?.[0]?.firstElementChild, context.prevStage);",
  "const next = parse_hvut_mooglemail_page_href(pager?.children?.[1]?.firstElementChild, context.nextStage);",
  "if (state[context.prevKey] !== null && page <= state[context.prevKey]) {",
  "state[context.prevKey] = prev;",
  "if (state[context.nextKey] !== null && page >= state[context.nextKey]) {",
  "state[context.nextKey] = next;",
  "context.prevButton.disabled = state[context.prevKey] === null;",
  "context.nextButton.disabled = state[context.nextKey] === null;",
  "var parse_hvut_mooglemail_mid = function (onclick, stage) {",
  "record_hvut_mooglemail_parse_failure(stage, { onclick: onclick || '' });",
  "var parse_hvut_mooglemail_page_row = function (row, filter, stage) {",
  "return { kind: 'empty' };",
  "const mid = parse_hvut_mooglemail_mid(row.getAttribute('onclick'), stage);",
  "return { kind: 'rejected' };",
  "returned: user === 'MoogleMail',",
  "subject: row.cells[1].textContent,",
  "var render_hvut_mooglemail_page_row = function (mail, formatDate) {",
  "tr.cells[0].textContent = (db || page).user;",
  "tr.cells[1].firstElementChild.textContent = (db || page).subject;",
  "href: create_hvut_equip_page_url({ eid: e.e, key: e.k })",
  "tr.classList[page.read ? 'remove' : 'add']('hvut-mm-unread');",
  "tr.classList[(db || page).returned ? 'add' : 'remove']('hvut-mm-returned');",
  "tr.classList[(db || page).filter !== page.filter ? 'add' : 'remove']('hvut-mm-removed');",
  "tr.classList[db ? 'remove' : 'add']('hvut-mm-nodb');",
  "var apply_hvut_mooglemail_view_identity = function (view) {",
  "const returnedMatch = /This message was returned from (.+), kupo!|This mail was sent to (.+), but was returned, kupo!/.exec(view.text.split('\\n').reverse().join('\\n'));",
  "view.filter = 'inbox';",
  "view.filter = 'read';",
  "view.filter = 'sent';",
  "view.read = view.filter === 'read' || view.filter === 'sent' && !view.recall;",
  "var parse_hvut_mooglemail_view_form = function (form, doc) {",
  "to: form.elements[3].value,",
  "from: form.elements[4].value,",
  "subject: form.elements[5].value,",
  "text: form.elements[6].value,",
  "attach: [],",
  "return: $qs('#mmail_showbuttons > img[src*=\"returnmail.png\"]', doc) ? true : false,",
  "recall: $qs('#mmail_showbuttons > img[src*=\"recallmail.png\"]', doc) ? true : false,",
  "reply: $qs('#mmail_showbuttons > img[src*=\"reply.png\"]', doc) ? true : false,",
  "take: $qs('#mmail_attachremove > img[src*=\"attach_takeall.png\"]', doc) ? true : false,",
  "return { view: view, mmtoken: form.elements.mmtoken.value };",
  "var parse_hvut_mooglemail_equip_attach = function (onmouseover, store, stage) {",
  "return record_hvut_mooglemail_parse_failure(stage, { eid: eid, onmouseover: onmouseover || '' });",
  "var parse_hvut_mooglemail_visible_attach_list = function (view, doc, html, context) {",
  "Object.assign($equip.dynjs_eqstore, parse_script_json(html, 'dynjs_eqstore'));",
  "const onmouseover = div.firstElementChild?.firstElementChild?.getAttribute('onmouseover');",
  "const equipAttach = parse_hvut_mooglemail_equip_attach(onmouseover, $equip.dynjs_eqstore, context.equipStage);",
  "view.error = '解析装备附件失败';",
  "const count = context.parseCount(exec[1]);",
  "view.cod = parse_hvut_mooglemail_count($id('mmail_currentcod', doc).textContent, /Requested Payment on Delivery: ([0-9,]+) credits/, context.codStage);",
  "view.error = '解析货到付款失败';",
  "view.cod = 0;",
  "var parse_hvut_mooglemail_historical_attach_text = function (view, parseCount) {",
  "const split = view.text.split('\\n\\n').reverse();",
  "const exec = /^Removed attachment: (?:([0-9,]+)x? (.+)|(.+))$/.exec(e);",
  "view.attach.unshift({ t: type, n: name });",
  "view.cod = parseCount(/^CoD Paid: ([0-9,]+) Credits$/.exec(split[1])?.[1]);",
  "const exec = /^Attached item removed: (?:([0-9,]+)x? (.+)|(.+)) \\(type=([chie]) id=(\\d+), CoD was ([0-9]+)C\\)$/.exec(split[0]);",
  "view.attach.push({ t: type, n: name, e: eid });",
  "view.cod = parseCount(exec[6]);",
  "var parse_hvut_mooglemail_view = function (doc, html, context) {",
  "const form = $id('mailform', doc);",
  "const response = classify_hvut_mooglemail_view_response(doc, context.rejectedStage);",
  "const parsed = parse_hvut_mooglemail_view_form(form, doc);",
  "parse_hvut_mooglemail_visible_attach_list(view, doc, html, {",
  "equipStage: context.equipStage,",
  "codStage: context.codStage,",
  "parse_hvut_mooglemail_historical_attach_text(view, context.parseCount);",
  "return { view: view, mmtoken: parsed.mmtoken };",
  "var classify_hvut_mooglemail_view_response = function (doc, stage) {",
  "var message = get_message(doc);",
  "var evidence = create_hvut_mooglemail_parse_evidence(stage, { reason: 'viewResponseMessageMissing' });",
  "return { kind: 'rejected', reason: 'viewResponseMessageMissing', error: '未知错误', evidence: evidence };",
  "var evidence = create_hvut_mooglemail_parse_evidence(stage, { reason: 'mailError', error: message });",
  "return { kind: 'rejected', reason: 'mailError', error: message, evidence: evidence };",
]) {
  requirePart("MoogleMail parse helper", helperRegion, required);
}

for (const required of [
  "credits.data.stock = parse_hvut_mooglemail_count($id('mmail_attachcredits').textContent, /Current Funds: ([0-9,]+) Credits/, 'writeCreditsStock');",
  "if (credits.data.stock === null) return false;",
  "hath.data.stock = parse_hvut_mooglemail_count($id('mmail_attachhath').textContent, /Current Funds: ([0-9,]+) Hath/, 'writeHathStock');",
  "if (hath.data.stock === null) return false;",
  "if (_mm.credits.init() === false) {",
  "return false;",
]) {
  requirePart("modern MoogleMail credits", modernCredits, required);
}

for (const required of [
  "credits.data.stock = parse_hvut_mooglemail_count($id('mmail_attachcredits').textContent, /Current Funds: ([0-9,]+) Credits/, 'legacyWriteCreditsStock');",
  "hath.data.stock = parse_hvut_mooglemail_count($id('mmail_attachhath').textContent, /Current Funds: ([0-9,]+) Hath/, 'legacyWriteHathStock');",
  "if (credits.data.stock === null) {",
  "if (hath.data.stock === null) {",
  "return false;",
]) {
  requirePart("legacy MoogleMail credits", legacyCredits, required);
}

for (const [label, body, stage] of [
  ["modern MoogleMail parser", modernMailParse, "viewCurrentCod"],
  ["legacy MoogleMail parser", legacyMailParse, "legacyViewCurrentCod"],
]) {
  requirePart(label, body, `codStage: '${stage}',`);
}

for (const [label, body, stage] of [
  ["modern MoogleMail parser", modernMailParse, "viewRejectedResponse"],
  ["legacy MoogleMail parser", legacyMailParse, "legacyViewRejectedResponse"],
]) {
  requirePart(label, body, `rejectedStage: '${stage}',`);
}

for (const [label, body, stage] of [
  ["modern MoogleMail parser", modernMailParse, "viewEquipAttach"],
  ["legacy MoogleMail parser", legacyMailParse, "legacyViewEquipAttach"],
]) {
  requirePart(label, body, "const parsed = parse_hvut_mooglemail_view(doc, html, {");
  requirePart(label, body, `equipStage: '${stage}',`);
  requirePart(label, body, "parseCount: _mm.parse_count,");
  requirePart(label, body, "if (parsed.mmtoken) {");
  requirePart(label, body, "_mm.mmtoken = parsed.mmtoken;");
  requirePart(label, body, "return parsed.view;");
  for (const forbidden of [
    "const view = {};",
    "const form = $id('mailform', doc);",
    "parse_hvut_mooglemail_view_form(form, doc)",
    "Object.assign(view, parsed.view);",
    "classify_hvut_mooglemail_view_response(doc,",
    "view.error = response.error;",
    "$id('mmail_attachlist', doc)",
    "parse_hvut_mooglemail_visible_attach_list(view, doc, html",
    "parse_hvut_mooglemail_historical_attach_text(view, _mm.parse_count);",
    "view.returned = true;",
    "view.filter = 'inbox';",
    "view.filter = 'read';",
    "view.filter = 'sent';",
    "view.user = view.from;",
    "view.user = view.to;",
    "view.read = view.filter === 'read'",
    "RegExp.$1 || RegExp.$2",
    "view.to = form.elements[3].value;",
    "view.from = form.elements[4].value;",
    "view.subject = form.elements[5].value;",
    "view.text = form.elements[6].value;",
    "view.attach = [];",
    "view.return = $qs('#mmail_showbuttons",
    "view.recall = $qs('#mmail_showbuttons",
    "view.reply = $qs('#mmail_showbuttons",
    "view.take = $qs('#mmail_attachremove",
    "apply_hvut_mooglemail_view_identity(view);",
    "const onmouseover = div.firstElementChild?.firstElementChild?.getAttribute('onmouseover');",
    "parse_hvut_mooglemail_equip_attach(onmouseover",
    "view.error = '解析装备附件失败';",
    "Object.assign($equip.dynjs_eqstore",
    "view.cod = parse_hvut_mooglemail_count($id('mmail_currentcod', doc).textContent",
    "view.error = '解析货到付款失败';",
    "const split = view.text.split('\\n\\n').reverse();",
    "Removed attachment:",
    "CoD Paid:",
    "Attached item removed:",
    "view.attach.unshift({",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} ${label} must delegate view identity to apply_hvut_mooglemail_view_identity`);
    }
  }
}

for (const [label, body, stateArg, prevKey, nextKey, prevButton, nextButton, prevStage, nextStage] of [
  ["modern MoogleMail page pager", modernPagePager, "_mm.page", "prev", "next", "_mm.page.node.prev", "_mm.page.node.next", "pagePrevHref", "pageNextHref"],
  ["legacy MoogleMail page pager", legacyPagePager, "_mm", "page_prev", "page_next", "_mm.node.page_prev", "_mm.node.page_next", "legacyPagePrevHref", "legacyPageNextHref"],
]) {
  requirePart(label, body, `update_hvut_mooglemail_page_window(${stateArg}, pager, p, {`);
  requirePart(label, body, `prevKey: '${prevKey}',`);
  requirePart(label, body, `nextKey: '${nextKey}',`);
  requirePart(label, body, `prevButton: ${prevButton},`);
  requirePart(label, body, `nextButton: ${nextButton},`);
  requirePart(label, body, `prevStage: '${prevStage}',`);
  requirePart(label, body, `nextStage: '${nextStage}',`);
  if (body.includes("parse_hvut_mooglemail_page_href(")) {
    violations.push(`${target} ${label} must delegate page-window parsing to update_hvut_mooglemail_page_window`);
  }
}

for (const [label, body, rowName, filter, stage] of [
  ["modern MoogleMail page create", modernPageCreate, "tr", "_mm.page.filter", "pageRowMid"],
  ["legacy MoogleMail page create", legacyPageCreate, "row", "_mm.page_filter", "legacyPageRowMid"],
]) {
  requirePart(label, body, `const rowRecord = parse_hvut_mooglemail_page_row(${rowName}, ${filter}, '${stage}');`);
  requirePart(label, body, "if (rowRecord.kind === 'empty') {");
  requirePart(label, body, "if (rowRecord.kind === 'rejected') {");
  requirePart(label, body, "if (!--count) scrollIntoView(table);");
  requirePart(label, body, "return;");
  requirePart(label, body, "const { mid, page } = rowRecord;");
  if (body.includes("parse_hvut_mooglemail_mid(")) {
    violations.push(`${target} ${label} must delegate page row identity to parse_hvut_mooglemail_page_row`);
  }
  if (body.includes("Date.parse(") || body.includes("returned = user === 'MoogleMail'") || body.includes("mail.page = { filter:")) {
    violations.push(`${target} ${label} must not reassemble mailbox page record outside parse_hvut_mooglemail_page_row`);
  }
}

for (const [label, body] of [
  ["modern MoogleMail page modify", modernPageModify],
  ["legacy MoogleMail page modify", legacyPageModify],
]) {
  requirePart(label, body, "render_hvut_mooglemail_page_row(mail, _mm.dts);");
  for (const forbidden of [
    "tr.cells[0].textContent",
    "tr.cells[1].firstElementChild.textContent",
    "db?.attach?.forEach",
    "create_hvut_equip_page_url({ eid: e.e, key: e.k })",
    "db?.cod",
    "hvut-mm-unread",
    "hvut-mm-returned",
    "hvut-mm-removed",
    "hvut-mm-nodb",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} ${label} must delegate page row rendering to render_hvut_mooglemail_page_row`);
    }
  }
}

for (const forbidden of [
  "credits.data.stock = _mm.parse_count(/Current Funds: ([0-9,]+) Credits/.exec($id('mmail_attachcredits').textContent)[1]);",
  "hath.data.stock = _mm.parse_count(/Current Funds: ([0-9,]+) Hath/.exec($id('mmail_attachhath').textContent)[1]);",
  "view.cod = _mm.parse_count(/Requested Payment on Delivery: ([0-9,]+) credits/.exec($id('mmail_currentcod', doc).textContent)[1]);",
  "parseInt(pager.children[0].firstElementChild.href?.match(/&page=(\\d+)/)[1])",
  "parseInt(pager.children[1].firstElementChild.href?.match(/&page=(\\d+)/)[1])",
  "parseInt(/mid=(\\d+)/.exec(tr.getAttribute('onclick'))[1])",
  "parseInt(/mid=(\\d+)/.exec(row.getAttribute('onclick'))[1])",
  "$equip.dynjs_eqstore[eid].k",
  "$equip.dynjs_eqstore[eid].t",
  "div.firstElementChild.firstElementChild?.getAttribute('onmouseover')",
  "view.error = get_message(doc) || '未知错误';",
  "classify_hvut_mooglemail_view_response(doc, 'viewRejectedResponse').error",
  "classify_hvut_mooglemail_view_response(doc, 'legacyViewRejectedResponse').error",
  "return { kind: 'rejected', reason: 'viewResponseMessageMissing', error: '未知错误' };",
  "return { kind: 'rejected', reason: 'mailError', error: message };",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked MoogleMail parse path: ${forbidden}`);
  }
}

for (const required of [
  'HVUT_MOOGLEMAIL_PARSE_FAILURE: "HVAA:lastHvutMoogleMailParseFailure"',
  'source("hvutMoogleMailParseFailure", DiagnosticEvidenceKey.HVUT_MOOGLEMAIL_PARSE_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mooglemail-parse-boundary] OK - MoogleMail parse failures fail closed with evidence");
