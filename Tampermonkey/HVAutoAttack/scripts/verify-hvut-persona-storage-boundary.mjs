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

const changeEOutcome = body(
  /persona\.change_e_outcome = async function \(eset\) \{[\s\S]*?\n  \};\n  persona\.change_e/,
  "persona.change_e_outcome"
);
const changeE = body(
  /persona\.change_e = async function \(eset\) \{[\s\S]*?\n  \};\n  persona\.set_button/,
  "persona.change_e"
);
const loadDynjsOutcome = body(
  /persona\.load_dynjs_outcome = async function \(doc\) \{[\s\S]*?\n  \};\n  persona\.load_dynjs/,
  "persona.load_dynjs_outcome"
);
const loadDynjs = body(
  /persona\.load_dynjs = async function \(doc\) \{[\s\S]*?\n  \};\n  \/\//,
  "persona.load_dynjs"
);
const parseStatsOutcome = body(
  /persona\.parse_stats_pane_outcome = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.set_value/,
  "persona.parse_stats_pane_outcome"
);
const setValue = body(
  /persona\.set_value = function \(name, value\) \{[\s\S]*?\n  \};\n  persona\.get_value/,
  "persona.set_value"
);
const readEquipsetRow = body(
  /persona\.read_equipset_row = function \(row\) \{[\s\S]*?\n  \};\n  persona\.save_equipset/,
  "persona.read_equipset_row"
);
const saveEquipsetOutcome = body(
  /persona\.save_equipset_outcome = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.save_equipset/,
  "persona.save_equipset_outcome"
);
const saveEquipset = body(
  /persona\.save_equipset = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.check_warning/,
  "persona.save_equipset"
);

if (
  !text.includes("const write_hvut_character_config_value = function (ctx, key, value, stage) {")
) {
  violations.push(`${target} character config writes must share one typed writer`);
}
if (!text.includes("persona.write_config_value = function (key, value, stage) {")) {
  violations.push(`${target} persona config writes must share one typed writer`);
}
for (const required of [
  "if (ctx.config.set(key, value)) {",
  "return { kind: 'accepted' };",
  "const evidence = record_hvut_config_storage_failure(stage, { key: key });",
  "return { kind: 'rejected', reason: 'configWriteFailed', key: key, evidence: evidence };",
  "return write_hvut_character_config_value(ctx, key, value, stage);",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} persona typed config writer must include ${required}`);
  }
}

requireParts("persona.change_e_outcome", changeEOutcome, [
  "const loadOutcome = await persona.load_dynjs_outcome(doc);",
  "if (loadOutcome.kind === 'rejected') return loadOutcome;",
  "persona.check_warning(doc);",
  "return { kind: 'accepted' };",
]);

requireParts("persona.change_e", changeE, [
  "const outcome = await persona.change_e_outcome(eset);",
  "return outcome.kind === 'accepted';",
]);

requireParts("persona.load_dynjs_outcome", loadDynjsOutcome, [
  "return reject_hvut_persona_sync('personaDynjsScriptMissing', {});",
  "return reject_hvut_persona_sync('personaDynjsFetchFailed', { message: String(error?.message || error) });",
  "return reject_hvut_persona_sync('personaDynjsApplyFailed', { message: String(error?.message || error) });",
  "const equipsetOutcome = persona.save_equipset_outcome(doc);",
  "if (equipsetOutcome.kind === 'rejected') return equipsetOutcome;",
  "const statsOutcome = persona.parse_stats_pane_outcome(doc);",
  "if (statsOutcome.kind === 'rejected') return statsOutcome;",
  "reloadCurrentPage(hvutReloadReason('HV_UTILS_PERSONA_DYNJS'))",
  "return { kind: 'accepted' };",
]);

requireParts("persona.load_dynjs", loadDynjs, [
  "const outcome = await persona.load_dynjs_outcome(doc);",
  "return outcome.kind === 'accepted';",
]);

for (const [label, value, key] of [
  ["persona.parse_stats_pane_outcome", parseStatsOutcome, "ch_style"],
  ["persona.set_value", setValue, "persona"],
  ["persona.save_equipset_outcome", saveEquipsetOutcome, "equipset"],
]) {
  requireParts(label, value, [
    `const write = persona.write_config_value('${key}'`,
    "if (write.kind === 'rejected') {",
    "show_hvut_generic_error();",
  ]);
}

requireParts("persona.set_value", setValue, ["return true;"]);
requireParts("persona.parse_stats_pane_outcome", parseStatsOutcome, [
  "return { kind: 'accepted', stats_pane: {} };",
  "return { kind: 'rejected', reason: 'personaCharacterStyleWriteRejected', evidence: write.evidence };",
  "return { kind: 'accepted', stats_pane: stats_pane };",
]);
for (const [required, expected] of [
  ["const statsOutcome = $persona.parse_stats_pane_outcome();", 4],
  ["if (statsOutcome.kind === 'rejected') return;", 2],
]) {
  const count = (text.match(new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || [])
    .length;
  if (count !== expected)
    violations.push(
      `${target} must keep ${expected} active stats pane outcome call(s) for ${required}, found ${count}`
    );
}
requireParts("persona.read_equipset_row", readEquipsetRow, [
  "const slot = row.children?.[0]?.textContent || '';",
  "const equipNode = row.children?.[1];",
  "if (!equipNode) return { slot };",
  "return { slot, category, name, customname, eid, key };",
]);
requireParts("persona.save_equipset_outcome", saveEquipsetOutcome, [
  "return { kind: 'rejected', reason: 'personaEquipsetWriteRejected', evidence: write.evidence };",
  "return { kind: 'accepted' };",
]);
requireParts("persona.save_equipset", saveEquipset, [
  "const outcome = persona.save_equipset_outcome(doc);",
  "return outcome.kind === 'accepted';",
]);

if (parseStatsOutcome.includes("ctx.config.set('ch_style', ch_style);\n    return stats_pane;")) {
  violations.push(`${target} persona.parse_stats_pane must not ignore ch_style write result`);
}
if (setValue.includes("ctx.config.set('persona', json);\n  };")) {
  violations.push(`${target} persona.set_value must not ignore persona write result`);
}
if (saveEquipsetOutcome.includes("ctx.config.set('equipset', equipset);\n  };")) {
  violations.push(`${target} persona.save_equipset must not ignore equipset write result`);
}
if (changeEOutcome.includes("if ((await persona.load_dynjs(doc)) === false) return false;")) {
  violations.push(
    `${target} persona.change_e must consume typed dynjs load outcome instead of direct boolean chaining`
  );
}
for (const forbidden of [
  "if (persona.save_equipset(doc) === false) return false;",
  "if (persona.parse_stats_pane(doc) === false) return false;",
  "persona.save_equipset(doc) === false",
  "persona.parse_stats_pane(doc) === false",
  "persona.parse_stats_pane = function",
  "$persona.parse_stats_pane(",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep old stats/equipset sync path: ${forbidden}`);
  }
}
for (const [label, value, forbidden] of [
  ["persona.parse_stats_pane_outcome", parseStatsOutcome, "ctx.config.set('ch_style', ch_style)"],
  ["persona.set_value", setValue, "ctx.config.set('persona', json)"],
  ["persona.save_equipset_outcome", saveEquipsetOutcome, "ctx.config.set('equipset', equipset)"],
]) {
  if (value.includes(forbidden)) {
    violations.push(
      `${target} ${label} must use typed persona config writer instead of ${forbidden}`
    );
  }
}
for (const forbidden of ["ctx.parseEquipElem(d.children[1])", "d.children[0].textContent"]) {
  if (saveEquipset.includes(forbidden)) {
    violations.push(
      `${target} persona.save_equipset must not parse raw equipset row children: ${forbidden}`
    );
  }
}

if (violations.length) {
  console.error("[verify-hvut-persona-storage-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-persona-storage-boundary] OK - persona storage failures fail closed");
