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

const bindDfct = body(
  /const bindDfct = function \(dfct, ctx\) \{[\s\S]*?\n\};\n\n\/\/ \$persona/,
  "bindDfct"
);
const init = body(/dfct\.init = function \(\) \{[\s\S]*?\n  \};\n  dfct\.create/, "dfct.init");
const changeOutcome = body(
  /dfct\.change_outcome = async function \(value\) \{[\s\S]*?\n  \};\n  dfct\.change/,
  "dfct.change_outcome"
);
const change = body(
  /dfct\.change = async function \(value\) \{[\s\S]*?\n  \};\n  dfct\.set_button_outcome/,
  "dfct.change"
);
const setButtonOutcome = body(
  /dfct\.set_button_outcome = function \(doc\) \{[\s\S]*?\n  \};\n  dfct\.set_button/,
  "dfct.set_button_outcome"
);
const setButton = body(
  /dfct\.set_button = function \(doc\) \{[\s\S]*?\n  \};\n\};\n\n\/\/ \$persona/,
  "dfct.set_button"
);

for (const [label, value] of [
  ["dfct.init", init],
  ["dfct.set_button_outcome", setButtonOutcome],
]) {
  requireParts(label, value, [
    "const write = write_hvut_character_config_value(ctx, 'ch_style', ch_style, 'difficultyCharacterStyleWrite');",
    "if (write.kind === 'rejected') {",
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  ]);
}
requireParts("dfct.init", init, ["return false;"]);

requireParts("character config writer", text, [
  "const write_hvut_character_config_value = function (ctx, key, value, stage) {",
  "if (ctx.config.set(key, value)) {",
  "return { kind: 'accepted' };",
  "const evidence = record_hvut_config_storage_failure(stage, { key: key });",
  "return { kind: 'rejected', reason: 'configWriteFailed', key: key, evidence: evidence };",
]);

requireParts("dfct.init", init, [
  "dfct.node.div.addEventListener('mouseenter', dfct.create);",
  "return true;",
]);
requireParts("dfct.change_outcome", changeOutcome, [
  "return reject_hvut_difficulty_refresh('difficultySettingsPageFetchFailed', { message: String(error?.message || error) });",
  "return reject_hvut_difficulty_refresh('difficultySettingsFormMissing', {});",
  "return reject_hvut_difficulty_refresh('difficultyApplyFetchFailed', { message: String(error?.message || error) });",
  "return dfct.set_button_outcome(doc);",
]);
requireParts("dfct.change", change, [
  "const outcome = await dfct.change_outcome(value);",
  "return outcome.kind === 'accepted';",
]);
requireParts("dfct.set_button_outcome", setButtonOutcome, [
  "return reject_hvut_difficulty_refresh('difficultyLevelReadoutRejected', {});",
  "return { kind: 'rejected', reason: 'difficultyCharacterStyleWriteRejected', evidence: write.evidence };",
  "return { kind: 'accepted', value: value };",
]);
requireParts("dfct.set_button", setButton, [
  "const outcome = dfct.set_button_outcome(doc);",
  "return outcome.kind === 'accepted';",
]);

for (const forbidden of [
  "ctx.config.set('ch_style', ch_style);\n    }\n    dfct.node.div.addEventListener",
  "ctx.config.set('ch_style', ch_style);\n  };",
  "if (!ctx.config.set('ch_style', ch_style)) {",
  "    dfct.set_button(doc);\n  };",
  "return dfct.set_button(doc);",
]) {
  if (bindDfct.includes(forbidden)) {
    violations.push(
      `${target} bindDfct must not ignore difficulty cache persistence: ${forbidden}`
    );
  }
}

if (violations.length) {
  console.error("[verify-hvut-difficulty-storage-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-difficulty-storage-boundary] OK - difficulty cache storage failures fail closed"
);
