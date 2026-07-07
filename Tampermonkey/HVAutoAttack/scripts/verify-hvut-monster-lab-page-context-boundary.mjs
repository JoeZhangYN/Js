import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_monster_lab_page_context = function (query) {",
  "var source = resolve_hvut_page_query(query);",
  "var section = source?.s;",
  "var ss = source?.ss;",
  "var create = source?.create;",
  "var slot = source?.slot;",
  "var pane = source?.pane;",
  "section: section,",
  "ss: ss,",
  "isMonsterLab: section === 'Bazaar' && ss === 'ml',",
  "isCreate: !!create,",
  "isSlot: !!slot,",
  "isSkillsPane: !!slot && pane === 'skills',",
  "shouldRenderMain: !create && !slot,",
  "var hvut_monster_lab_page_context = null;",
  "var get_hvut_monster_lab_page_context = function () {",
  "hvut_monster_lab_page_context = hvut_monster_lab_page_context || create_hvut_monster_lab_page_context();",
  "return hvut_monster_lab_page_context;",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Monster Lab page context boundary: ${required}`);
  }
}

const monsterLabBodies = [
  ...text.matchAll(/if \(get_hvut_monster_lab_page_context\(\)\.isMonsterLab && \$config\.settings\.monsterLab\) \{[\s\S]*?\n\} else\n\/\/ \[END (?:11|12)\] Bazaar - Monster Lab/g),
].map((match) => match[0]);

if (monsterLabBodies.length !== 2) {
  violations.push(`${target} must keep both Monster Lab segment bodies visible, found ${monsterLabBodies.length}`);
}

for (const [index, body] of monsterLabBodies.entries()) {
  for (const required of [
    "const monsterLabPage = get_hvut_monster_lab_page_context();",
    "if (monsterLabPage.isCreate) {",
    "} else if (monsterLabPage.isSlot) {",
    "if (monsterLabPage.isSkillsPane) {",
    "} else if (monsterLabPage.shouldRenderMain) {",
    "replace('ss=ml', 'ss=ml&pane=skills')",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab body[${index}] must consume page context: ${required}`);
    }
  }
  for (const forbidden of [
    "_query.s === 'Bazaar' && _query.ss === 'ml'",
    "_query.ss === 'ml'",
    "if (_query.create) {",
    "} else if (_query.slot) {",
    "if (_query.pane === 'skills') {",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} Monster Lab body[${index}] must not rebuild lifecycle from raw query: ${forbidden}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-hvut-monster-lab-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-monster-lab-page-context-boundary] OK - Monster Lab lifecycle routing uses one page context");
