import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const updateBodies = [...text.matchAll(/update: async function \(\) \{[\s\S]*?\n\s*force_update:/g)].map((match) => match[0]);
const runBodies = [...text.matchAll(/run: async function \(\) \{[\s\S]*?\n      \},\n      save:/g)].map(
  (match) => match[0]
);

if (updateBodies.length !== 2) {
  violations.push(`${target} must keep both Monster Lab update segment entries visible`);
}

if (runBodies.length !== 2) {
  violations.push(`${target} must keep both Monster Lab run segment entries visible`);
}

for (const [index, body] of updateBodies.entries()) {
  for (const required of [
    "try {\n          await Promise.all(requests);",
    "catch (_error) {\n          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "_ml.upgrade.node.button.disabled = false;",
    "_ml.upgrade.node.run.disabled = false;",
    "_ml.upgrade.node.run.value = '失败';",
    "return false;",
    "return true;",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab update[${index}] must guard failure with ${required}`);
    }
  }
  if (/await Promise\.all\(requests\);\n\s*\$config\.set\('ml_log'/.test(body)) {
    violations.push(`${target} Monster Lab update[${index}] must not save success after unchecked Promise.all`);
  }
}

for (const [index, body] of runBodies.entries()) {
  for (const required of [
    "try {\n          await Promise.all(requests);",
    "catch (_error) {\n          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "_ml.upgrade.node.run.disabled = false;",
    "_ml.upgrade.node.update.disabled = false;",
    "_ml.upgrade.node.run.value = '失败';",
    "return false;",
    "return _ml.upgrade.update();",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab run[${index}] must guard failure with ${required}`);
    }
  }
  if (/await Promise\.all\(requests\);\n\s*_ml\.upgrade\.update\(\);/.test(body)) {
    violations.push(`${target} Monster Lab run[${index}] must not fire update after unchecked Promise.all`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-monster-lab-upgrade-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-monster-lab-upgrade-boundary] OK - Monster Lab upgrade/update failures fail closed");
