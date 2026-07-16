import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvUtilsFile = path.normalize("src/i18n/hv-utils.js");
const evidenceFile = path.normalize("src/core/diagnostic-evidence-keys.js");
const text = fs.readFileSync(path.join(root, hvUtilsFile), "utf8");
const evidenceText = fs.readFileSync(path.join(root, evidenceFile), "utf8");
const violations = [];

function rel(file) {
  return file.replaceAll("\\", "/");
}

for (const required of [
  "var record_hvut_shrine_item_parse_failure = function (stage, detail) {",
  "sessionStorage.setItem('HVAA:lastHvutShrineItemParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_shrine_offer_item_data = function (onclick) {",
  "var exec = /set_shrine_item\\((\\w+),(\\d+),(\\d+),'(.+?)'\\)/.exec(onclick || '');",
  "var parse_hvut_shrine_offer_item = function (div, stage) {",
  "var item = parse_hvut_shrine_offer_item_data(onclick);",
  "!item.name",
  "return record_hvut_shrine_item_parse_failure(stage, { onclick: onclick, text: div?.textContent || '' });",
  "const itemData = parse_hvut_shrine_offer_item(div, 'offerItemRow');",
  "const itemData = parse_hvut_shrine_offer_item(div, 'legacyOfferItemRow');",
  "if (itemData === null) {",
  "tr.classList.add('hvut-warn');",
  "const { iid, stock, bulk, name } = itemData;",
]) {
  if (!text.includes(required)) {
    violations.push(`${rel(hvUtilsFile)} missing Shrine item boundary: ${required}`);
  }
}

if (text.includes("const name = div.textContent;")) {
  violations.push(
    `${rel(hvUtilsFile)} Shrine and mail flows must not replace authoritative item identity with translated DOM text`
  );
}

if (/\{\s*iid,\s*stock,\s*bulk\s*\}\s*=\s*\$item\.get_data/.test(text)) {
  violations.push(
    `${rel(hvUtilsFile)} must not destructure Shrine offer identity directly from $item.get_data`
  );
}

const shrineOfferParser =
  /var parse_hvut_shrine_offer_item = function \(div, stage\) \{[\s\S]*?\n  \};/.exec(text)?.[0] ||
  "";
if (!shrineOfferParser) {
  violations.push(`${rel(hvUtilsFile)} must keep Shrine offer item parser visible`);
} else if (shrineOfferParser.includes("$item.get_data")) {
  violations.push(
    `${rel(hvUtilsFile)} Shrine offer item parser must not depend on branch-private $item`
  );
}

for (const initBody of text.matchAll(
  /\$qsa\('\.itemlist tr'\)\.forEach\(\(tr\) => \{[\s\S]*?\n\s*\}\);/g
)) {
  const body = initBody[0];
  if (!body.includes("dataset: { action: 'offer'")) continue;
  const parserIndex = body.indexOf("parse_hvut_shrine_offer_item");
  const buttonIndex = body.indexOf("dataset: { action: 'offer'");
  if (parserIndex < 0 || buttonIndex < 0 || buttonIndex < parserIndex) {
    violations.push(
      `${rel(hvUtilsFile)} Shrine offer button must be created only after item identity parser success`
    );
  }
}

for (const required of [
  'HVUT_SHRINE_ITEM_PARSE_FAILURE: "HVAA:lastHvutShrineItemParseFailure"',
  'source("hvutShrineItemParseFailure", DiagnosticEvidenceKey.HVUT_SHRINE_ITEM_PARSE_FAILURE)',
]) {
  if (!evidenceText.includes(required)) {
    violations.push(`${rel(evidenceFile)} missing Shrine item diagnostic source: ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-shrine-item-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-shrine-item-boundary] OK - Shrine offer item identity parse fails closed"
);
