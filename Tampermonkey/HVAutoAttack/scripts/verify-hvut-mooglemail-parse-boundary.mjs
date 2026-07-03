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
  /var record_hvut_mooglemail_parse_failure = function \(stage, detail\) \{[\s\S]*?\n  var reloadCurrentPage/.exec(text)?.[0] || "";
const modernCredits =
  /_mm\.credits = \{[\s\S]*?\n    if \(_mm\.credits\.init\(\) === false\) \{[\s\S]*?\n    \}/.exec(text)?.[0] || "";
const legacyCredits =
  /_mm\.credits_list = \[\];[\s\S]*?\n    _mm\.credits_multi = function/.exec(text)?.[0] || "";
const mailParseBodies = [...text.matchAll(/parse: function \(html\) \{[\s\S]*?\n      \},\n      update: function/g)].map((m) => m[0]);
const legacyMailParse =
  /_mm\.mail_parse = function \(arg\) \{[\s\S]*?\n    \};\n\n    _mm\.mail_update/.exec(text)?.[0] || "";
const modernPagePager =
  /pager: function \(pager, p\) \{[\s\S]*?\n      \},\n      create: function/.exec(text)?.[0] || "";
const modernPageCreate =
  /create: function \(list, p\) \{[\s\S]*?\n      \},\n      modify: function/.exec(text)?.[0] || "";
const legacyPagePager =
  /_mm\.page_pager = function \(pager, p\) \{[\s\S]*?\n    \};\n\n    _mm\.page_create/.exec(text)?.[0] || "";
const legacyPageCreate =
  /_mm\.page_create = function \(list, p\) \{[\s\S]*?\n    \};\n\n    _mm\.page_modify/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["MoogleMail parse helper", helperRegion],
  ["modern MoogleMail credits", modernCredits],
  ["legacy MoogleMail credits", legacyCredits],
  ["legacy MoogleMail parser", legacyMailParse],
  ["modern MoogleMail page pager", modernPagePager],
  ["modern MoogleMail page create", modernPageCreate],
  ["legacy MoogleMail page pager", legacyPagePager],
  ["legacy MoogleMail page create", legacyPageCreate],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

if (mailParseBodies.length !== 1) {
  violations.push(`${target} must keep one modern MoogleMail parser, found ${mailParseBodies.length}`);
}
const modernMailParse = mailParseBodies[0] || "";

for (const required of [
  "sessionStorage.setItem('HVAA:lastHvutMoogleMailParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_mooglemail_count = function (text, pattern, stage) {",
  "record_hvut_mooglemail_parse_failure(stage, { text: text || '' });",
  "var parse_hvut_mooglemail_page_href = function (link, stage) {",
  "if (!link) return null;",
  "record_hvut_mooglemail_parse_failure(stage, { href: href });",
  "var parse_hvut_mooglemail_mid = function (onclick, stage) {",
  "record_hvut_mooglemail_parse_failure(stage, { onclick: onclick || '' });",
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
  requirePart(label, body, `view.cod = parse_hvut_mooglemail_count($id('mmail_currentcod', doc).textContent, /Requested Payment on Delivery: ([0-9,]+) credits/, '${stage}');`);
  requirePart(label, body, "if (view.cod === null) {");
  requirePart(label, body, "view.error = '解析货到付款失败';");
  requirePart(label, body, "view.cod = 0;");
}

for (const [label, body, prevStage, nextStage] of [
  ["modern MoogleMail page pager", modernPagePager, "pagePrevHref", "pageNextHref"],
  ["legacy MoogleMail page pager", legacyPagePager, "legacyPagePrevHref", "legacyPageNextHref"],
]) {
  requirePart(label, body, `parse_hvut_mooglemail_page_href(pager?.children?.[0]?.firstElementChild, '${prevStage}')`);
  requirePart(label, body, `parse_hvut_mooglemail_page_href(pager?.children?.[1]?.firstElementChild, '${nextStage}')`);
}

for (const [label, body, rowName, stage] of [
  ["modern MoogleMail page create", modernPageCreate, "tr", "pageRowMid"],
  ["legacy MoogleMail page create", legacyPageCreate, "row", "legacyPageRowMid"],
]) {
  requirePart(label, body, `const mid = parse_hvut_mooglemail_mid(${rowName}.getAttribute('onclick'), '${stage}');`);
  requirePart(label, body, "if (mid === null) {");
  requirePart(label, body, "if (!--count) scrollIntoView(table);");
  requirePart(label, body, "return;");
}

for (const forbidden of [
  "credits.data.stock = _mm.parse_count(/Current Funds: ([0-9,]+) Credits/.exec($id('mmail_attachcredits').textContent)[1]);",
  "hath.data.stock = _mm.parse_count(/Current Funds: ([0-9,]+) Hath/.exec($id('mmail_attachhath').textContent)[1]);",
  "view.cod = _mm.parse_count(/Requested Payment on Delivery: ([0-9,]+) credits/.exec($id('mmail_currentcod', doc).textContent)[1]);",
  "parseInt(pager.children[0].firstElementChild.href?.match(/&page=(\\d+)/)[1])",
  "parseInt(pager.children[1].firstElementChild.href?.match(/&page=(\\d+)/)[1])",
  "parseInt(/mid=(\\d+)/.exec(tr.getAttribute('onclick'))[1])",
  "parseInt(/mid=(\\d+)/.exec(row.getAttribute('onclick'))[1])",
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
