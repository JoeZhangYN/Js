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
const parseBodies = [...text.matchAll(/_ml\.parse = function \(mob, doc\) \{[\s\S]*?\n    \};/g)].map(
  (match) => match[0]
);
const onsuccessBodies = [...text.matchAll(/onsuccess: function \(index, doc\) \{[\s\S]*?\n      \},\n      onerror:/g)].map(
  (match) => match[0]
);
const saveBodies = [...text.matchAll(/save: function \(\) \{\n        _ml\.mobs\.forEach[\s\S]*?\n      \},\n      load:/g)].map(
  (match) => match[0]
);

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

for (const [index, body] of parseBodies.entries()) {
  for (const required of [
    "if (!$config.set('ml_log', _ml.log)) {\n        return false;",
    "return true;",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab parse[${index}] must guard persistence with ${required}`);
    }
  }
  if (/\$config\.set\('ml_log', _ml\.log\);\n\s*\};/.test(body)) {
    violations.push(`${target} Monster Lab parse[${index}] must not ignore ml_log write result`);
  }
}

for (const [index, body] of onsuccessBodies.entries()) {
  for (const required of [
    "if (_ml.parse(mob, doc) === false) {",
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "_ml.main.onerror(index);",
    "return false;",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab onsuccess[${index}] must guard parse persistence with ${required}`);
    }
  }
  if (/\n\s*_ml\.parse\(mob, doc\);\n\s*mob\.status = 1;/.test(body)) {
    violations.push(`${target} Monster Lab onsuccess[${index}] must not mark success after unchecked parse`);
  }
}

for (const [index, body] of updateBodies.entries()) {
  for (const required of [
    "try {\n          await Promise.all(requests);",
    "catch (_error) {\n          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "_ml.upgrade.node.button.disabled = false;",
    "_ml.upgrade.node.run.disabled = false;",
    "_ml.upgrade.node.run.value = '失败';",
    "return false;",
    "if (!$config.set('ml_log', _ml.log)) {\n          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n          _ml.upgrade.node.button.disabled = false;",
    "return true;",
    "if (_ml.parse(mob, doc) === false) {\n            throw new Error('ml_log persistence failed');",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab update[${index}] must guard failure with ${required}`);
    }
  }
  if (/await Promise\.all\(requests\);[\s\S]*?\n\s*\$config\.set\('ml_log'/.test(body)) {
    violations.push(`${target} Monster Lab update[${index}] must not save success after unchecked Promise.all`);
  }
  if (/\$config\.set\('ml_log', _ml\.log\);\n\s*_ml\.upgrade\.node\.button\.disabled = false;/.test(body)) {
    violations.push(`${target} Monster Lab update[${index}] must not complete UI after unchecked ml_log write`);
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
    "if (!$config.set('ml_log', _ml.log)) {\n          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n          return false;",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab run[${index}] must guard failure with ${required}`);
    }
  }
  if (/await Promise\.all\(requests\);\n\s*_ml\.upgrade\.update\(\);/.test(body)) {
    violations.push(`${target} Monster Lab run[${index}] must not fire update after unchecked Promise.all`);
  }
  if (/\$config\.set\('ml_log', _ml\.log\);\n\s*_ml\.upgrade\.node\.run\.disabled = true;/.test(body)) {
    violations.push(`${target} Monster Lab run[${index}] must not execute upgrades after unchecked ml_log write`);
  }
}

for (const [index, body] of saveBodies.entries()) {
  for (const required of [
    "if (!$config.set('ml_log', _ml.log)) {\n          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n          return false;",
    "return true;",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Monster Lab save[${index}] must guard persistence with ${required}`);
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

console.log("[verify-hvut-monster-lab-upgrade-boundary] OK - Monster Lab upgrade/update failures fail closed");
