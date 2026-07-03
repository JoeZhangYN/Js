import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function body(pattern, label) {
  const match = pattern.exec(text);
  if (!match) violations.push(`${target} must keep ${label} visible`);
  return match?.[0] || "";
}

function requireParts(label, value, parts) {
  for (const part of parts) {
    if (!value.includes(part)) violations.push(`${target} ${label} must include ${part}`);
  }
}

const changeE = body(/persona\.change_e = async function \(eset\) \{[\s\S]*?\n  \};\n  persona\.set_button/, "persona.change_e");
const loadDynjs = body(/persona\.load_dynjs = async function \(doc\) \{[\s\S]*?\n  \};\n  \/\//, "persona.load_dynjs");
const parseStats = body(/persona\.parse_stats_pane = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.set_value/, "persona.parse_stats_pane");
const setValue = body(/persona\.set_value = function \(name, value\) \{[\s\S]*?\n  \};\n  persona\.get_value/, "persona.set_value");
const readEquipsetRow = body(/persona\.read_equipset_row = function \(row\) \{[\s\S]*?\n  \};\n  persona\.save_equipset/, "persona.read_equipset_row");
const saveEquipset = body(/persona\.save_equipset = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.check_warning/, "persona.save_equipset");

requireParts("persona.change_e", changeE, [
  "if ((await persona.load_dynjs(doc)) === false) return false;",
  "persona.check_warning(doc);",
  "return true;",
]);

requireParts("persona.load_dynjs", loadDynjs, [
  "if (persona.save_equipset(doc) === false) return false;",
  "if (persona.parse_stats_pane(doc) === false) return false;",
  "reloadCurrentPage(hvutReloadReason('HV_UTILS_PERSONA_DYNJS'))",
  "return true;",
]);

for (const [label, value, key] of [
  ["persona.parse_stats_pane", parseStats, "ch_style"],
  ["persona.set_value", setValue, "persona"],
  ["persona.save_equipset", saveEquipset, "equipset"],
]) {
  requireParts(label, value, [
    `if (!ctx.config.set('${key}'`,
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "return false;",
  ]);
}

requireParts("persona.set_value", setValue, ["return true;"]);
requireParts("persona.read_equipset_row", readEquipsetRow, [
  "const slot = row.children?.[0]?.textContent || '';",
  "const equipNode = row.children?.[1];",
  "if (!equipNode) return { slot };",
  "return { slot, category, name, customname, eid, key };",
]);
requireParts("persona.save_equipset", saveEquipset, ["return true;"]);

if (parseStats.includes("ctx.config.set('ch_style', ch_style);\n    return stats_pane;")) {
  violations.push(`${target} persona.parse_stats_pane must not ignore ch_style write result`);
}
if (setValue.includes("ctx.config.set('persona', json);\n  };")) {
  violations.push(`${target} persona.set_value must not ignore persona write result`);
}
if (saveEquipset.includes("ctx.config.set('equipset', equipset);\n  };")) {
  violations.push(`${target} persona.save_equipset must not ignore equipset write result`);
}
for (const forbidden of [
  "ctx.parseEquipElem(d.children[1])",
  "d.children[0].textContent",
]) {
  if (saveEquipset.includes(forbidden)) {
    violations.push(`${target} persona.save_equipset must not parse raw equipset row children: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-persona-storage-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-persona-storage-boundary] OK - persona storage failures fail closed");
