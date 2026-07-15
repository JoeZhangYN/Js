import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const keysText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence-keys.js"), "utf8");
const diagnosticTestText = fs.readFileSync(
  path.join(root, "src/core/diagnostic-evidence.test.js"),
  "utf8"
);
const violations = [];

const updateBodies = [
  ...text.matchAll(/update: async function \(\) \{[\s\S]*?\n\s*force_update:/g),
].map((match) => match[0]);
const runBodies = [
  ...text.matchAll(/run: async function \(\) \{[\s\S]*?\n      \},\n      save:/g),
].map((match) => match[0]);
const parseBodies = [
  ...text.matchAll(/_ml\.parse = function \(mob, doc\) \{[\s\S]*?\n    \};/g),
].map((match) => match[0]);
const onsuccessBodies = [
  ...text.matchAll(
    /onsuccess: async function \(index, doc\) \{[\s\S]*?\n      \},\n      onerror:/g
  ),
].map((match) => match[0]);
const saveBodies = [
  ...text.matchAll(
    /save: async function \(\) \{\n        _ml\.mobs\.forEach[\s\S]*?\n      \},\n      load:/g
  ),
].map((match) => match[0]);

if (updateBodies.length !== 2) {
  violations.push(`${target} must keep both Monster Lab update segment entries visible`);
}

if (runBodies.length !== 2) {
  violations.push(`${target} must keep both Monster Lab run segment entries visible`);
}

if (parseBodies.length !== 2) {
  violations.push(`${target} must keep both Monster Lab parse segment entries visible`);
}

if (onsuccessBodies.length !== 2) {
  violations.push(`${target} must keep both Monster Lab onsuccess segment entries visible`);
}

if (saveBodies.length !== 2) {
  violations.push(`${target} must keep both Monster Lab save segment entries visible`);
}

for (const required of [
  "var record_hvut_monster_lab_upgrade_failure = function (stage, detail) {",
  "capability: 'hvutMonsterLabUpgrade'",
  "sessionStorage.setItem('HVAA:lastHvutMonsterLabUpgradeFailure'",
  "var classify_hvut_monster_lab_upgrade_response = function (html, stage, detail) {",
  "record_hvut_monster_lab_upgrade_failure(stage, { ...detail, reason: 'emptyResponse' });",
  "return { kind: 'rejected', reason: 'emptyResponse', evidence: evidence };",
  "return { kind: 'accepted' };",
  "var create_hvut_monster_lab_slot_url = function (mob) {",
]) {
  if (!text.includes(required))
    violations.push(`${target} must include Monster Lab upgrade diagnostic recorder: ${required}`);
}

for (const required of [
  'HVUT_MONSTER_LAB_UPGRADE_FAILURE: "HVAA:lastHvutMonsterLabUpgradeFailure"',
  'source("hvutMonsterLabUpgradeFailure", DiagnosticEvidenceKey.HVUT_MONSTER_LAB_UPGRADE_FAILURE)',
]) {
  if (!keysText.includes(required))
    violations.push(`diagnostic evidence keys must include ${required}`);
}

if (!diagnosticTestText.includes("HVAA:lastHvutMonsterLabUpgradeFailure")) {
  violations.push("diagnostic-evidence.test.js must cover HVUT Monster Lab upgrade evidence");
}

for (const [index, body] of parseBodies.entries()) {
  for (const required of ["return true;"]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab parse[${index}] must complete with ${required}`);
    }
  }
  if (body.includes("$config.set('ml_log'") || body.includes("$config.set_derived('ml_log'")) {
    violations.push(`${target} Monster Lab parse[${index}] must remain persistence-free`);
  }
}

for (const [index, body] of onsuccessBodies.entries()) {
  for (const required of [
    "if (_ml.parse(mob, doc) === false) {",
    "show_hvut_generic_error();",
    "_ml.main.onerror(index);",
    "return false;",
    "if (!(await $config.set_derived('ml_log', _ml.log))) return false;",
  ]) {
    if (!body.includes(required)) {
      violations.push(
        `${target} Monster Lab onsuccess[${index}] must guard parse and own persistence with ${required}`
      );
    }
  }
  if (/\n\s*_ml\.parse\(mob, doc\);\n\s*mob\.status = 1;/.test(body)) {
    violations.push(
      `${target} Monster Lab onsuccess[${index}] must not mark success after unchecked parse`
    );
  }
}

for (const [index, body] of updateBodies.entries()) {
  for (const required of [
    "try {\n          await run_hvut_async_task_layout('PARALLEL', mobs, update);",
    "catch (error) {\n          const evidence = record_hvut_monster_lab_upgrade_failure(",
    "show_hvut_failure_report('Monster Lab upgrade failed', evidence);",
    "_ml.upgrade.node.button.disabled = false;",
    "_ml.upgrade.node.run.disabled = false;",
    "_ml.upgrade.node.run.value = '失败';",
    "return false;",
    "if (!(await $config.set_derived('ml_log', _ml.log))) {\n          show_hvut_config_storage_failure_report('monsterLabUpgradeLogSave', { key: 'ml_log' });\n          _ml.upgrade.node.button.disabled = false;",
    "return true;",
    "if (_ml.parse(mob, doc) === false) {\n            throw new Error('monster lab parse failed');",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab update[${index}] must guard failure with ${required}`);
    }
  }
  if (/Promise\.all\s*\(/.test(body)) {
    violations.push(
      `${target} Monster Lab update[${index}] must use the typed parallel layout before saving`
    );
  }
  if (
    /\$config\.set\('ml_log', _ml\.log\);\n\s*_ml\.upgrade\.node\.button\.disabled = false;/.test(
      body
    )
  ) {
    violations.push(
      `${target} Monster Lab update[${index}] must not complete UI after unchecked ml_log write`
    );
  }
  if (/catch \(_error\) \{\n\s*alert\(IS_ISEKAI/.test(body)) {
    violations.push(`${target} Monster Lab update[${index}] must not keep untyped request failure`);
  }
  if (body.includes("$ajax.fetch(`?s=Bazaar&ss=ml&slot=${mob.index}`")) {
    violations.push(
      `${target} Monster Lab update[${index}] must route slot fetches through create_hvut_monster_lab_slot_url`
    );
  }
}

for (const [index, body] of runBodies.entries()) {
  const emptyResponseStage =
    index === 0 ? "upgradeRunEmptyResponse" : "legacyUpgradeRunEmptyResponse";
  for (const required of [
    "try {\n          await run_hvut_async_task_layout('GROUPED', urls, ([url, post]) => upgrade(url, post), { identityOf: ([url]) => url });",
    "catch (error) {\n          const evidence = record_hvut_monster_lab_upgrade_failure(",
    "show_hvut_failure_report('Monster Lab upgrade failed', evidence);",
    "_ml.upgrade.node.run.disabled = false;",
    "_ml.upgrade.node.update.disabled = false;",
    "_ml.upgrade.node.run.value = '失败';",
    "return false;",
    "return _ml.upgrade.update();",
    "if (!(await $config.set_derived('ml_log', _ml.log))) {\n          show_hvut_config_storage_failure_report('monsterLabUpgradeLogSave', { key: 'ml_log' });\n          return false;",
    "const html = await $ajax.fetch(url, post);",
    `const response = classify_hvut_monster_lab_upgrade_response(html, '${emptyResponseStage}', { url: url, post: post });`,
    "if (response.kind === 'rejected') {",
    "throw new Error('monster lab upgrade response unavailable');",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab run[${index}] must guard failure with ${required}`);
    }
  }
  if (/Promise\.all\s*\(/.test(body)) {
    violations.push(
      `${target} Monster Lab run[${index}] must serialize per-monster writes and parallelize groups`
    );
  }
  if (
    /\$config\.set\('ml_log', _ml\.log\);\n\s*_ml\.upgrade\.node\.run\.disabled = true;/.test(body)
  ) {
    violations.push(
      `${target} Monster Lab run[${index}] must not execute upgrades after unchecked ml_log write`
    );
  }
  if (/^\s*await \$ajax\.fetch\(url, post\);$/m.test(body)) {
    violations.push(
      `${target} Monster Lab run[${index}] must not count upgrade after unclassified response`
    );
  }
  if (/catch \(_error\) \{\n\s*alert\(IS_ISEKAI/.test(body)) {
    violations.push(`${target} Monster Lab run[${index}] must not keep untyped request failure`);
  }
  if (body.includes("`?s=Bazaar&ss=ml&slot=${mob.index}`")) {
    violations.push(
      `${target} Monster Lab run[${index}] must route slot command URLs through create_hvut_monster_lab_slot_url`
    );
  }
}

for (const [index, body] of saveBodies.entries()) {
  for (const required of [
    "if (!(await $config.set_derived('ml_log', _ml.log))) {\n          show_hvut_config_storage_failure_report('monsterLabUpgradeLogSave', { key: 'ml_log' });\n          return false;",
    "return true;",
  ]) {
    if (!body.includes(required)) {
      violations.push(
        `${target} Monster Lab save[${index}] must guard persistence with ${required}`
      );
    }
  }
  if (/\$config\.set\('ml_log', _ml\.log\);\n\s*\}/.test(body)) {
    violations.push(`${target} Monster Lab save[${index}] must not ignore ml_log write result`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-monster-lab-upgrade-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-monster-lab-upgrade-boundary] OK - Monster Lab upgrade/update failures fail closed"
);
