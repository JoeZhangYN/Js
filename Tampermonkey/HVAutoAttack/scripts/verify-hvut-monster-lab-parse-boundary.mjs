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
  /var record_hvut_monster_lab_parse_failure = function \(stage, detail\) \{[\s\S]*?\n  var reloadCurrentPage/.exec(
    text
  )?.[0] || "";
function initBodyFor(stage) {
  const stageIndex = text.indexOf(stage);
  if (stageIndex === -1) return "";
  const start = text.lastIndexOf("init: async function () {", stageIndex);
  const end = text.indexOf("\n      },", stageIndex);
  return start === -1 || end === -1 ? "" : text.slice(start, end + "\n      },".length);
}
const initBodies = [
  initBodyFor("upgradeChaosTokenCost"),
  initBodyFor("legacyUpgradeChaosTokenCost"),
].filter(Boolean);
const sortBodies = [
  ...text.matchAll(/sort: function \(key\) \{[\s\S]*?\n      \},\n      feed:/g),
].map((match) => match[0]);

if (!helperRegion) violations.push(`${target} must keep Monster Lab parse helper visible`);
if (initBodies.length !== 2) {
  violations.push(
    `${target} must keep both Monster Lab upgrader init entries visible, found ${initBodies.length}`
  );
}
if (sortBodies.length !== 2) {
  violations.push(
    `${target} must keep both Monster Lab sort entries visible, found ${sortBodies.length}`
  );
}

for (const required of [
  "sessionStorage.setItem('HVAA:lastHvutMonsterLabParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_monster_lab_chaos_token_cost = function (text, stage) {",
  "record_hvut_monster_lab_parse_failure(stage, { text: text || '' });",
  "var parse_hvut_monster_lab_main_surface = function (div, stage) {",
  "record_hvut_monster_lab_parse_failure(stage, { reason: 'monsterMainSurfaceMissing'",
  "return { name: nameNode.textContent, className: classNode.textContent, pl: pl, plNode: plNode",
  "var parse_hvut_monster_lab_empty_slot = function (div, stage) {",
  "record_hvut_monster_lab_parse_failure(stage, { reason: 'emptyMonsterSlotMissing'",
]) {
  requirePart("Monster Lab parse helper", helperRegion, required);
}

for (const [index, body] of initBodies.entries()) {
  const stage = index === 0 ? "upgradeChaosTokenCost" : "legacyUpgradeChaosTokenCost";
  for (const required of [
    `const ct_next = parse_hvut_monster_lab_chaos_token_cost($id('monster_actions').textContent, '${stage}');`,
    "if (ct_next === null) {",
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "_ml.upgrade.node.button.disabled = false;",
    "_ml.upgrade.inited = false;",
    "return false;",
  ]) {
    requirePart(`Monster Lab upgrader init[${index}]`, body, required);
  }
}

for (const [index, body] of sortBodies.entries()) {
  const stage = index === 0 ? "emptyMonsterSlot" : "legacyEmptyMonsterSlot";
  for (const required of [
    `.map((div) => parse_hvut_monster_lab_empty_slot(div, '${stage}'))`,
    ".filter((slot) => slot !== null)",
    "_ml.main.sort.list = _ml.mobs.filter((mob) => mob).concat(empty);",
  ]) {
    requirePart(`Monster Lab sort[${index}]`, body, required);
  }
}

for (const forbidden of [
  "const ct_next = parseInt(/Cost: (\\d+) Chaos Token/.exec($id('monster_actions').textContent)[1]);",
  "mob.name = div.children[1].textContent;",
  "mob.class = div.children[3].textContent;",
  "mob.pl = parseInt(div.children[2].textContent.slice(4));",
  "div.children[2].textContent = mob.pl;",
  "const hungerdiv = div.children[4];",
  "const moralediv = div.children[5];",
  "hungerdiv.firstElementChild.firstElementChild",
  "moralediv.firstElementChild.firstElementChild",
  "index: parseInt(div.firstElementChild.textContent)",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked Monster Lab parse path: ${forbidden}`);
  }
}

for (const required of [
  'HVUT_MONSTER_LAB_PARSE_FAILURE: "HVAA:lastHvutMonsterLabParseFailure"',
  'source("hvutMonsterLabParseFailure", DiagnosticEvidenceKey.HVUT_MONSTER_LAB_PARSE_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-monster-lab-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-monster-lab-parse-boundary] OK - Monster Lab parse failures fail closed with evidence"
);
