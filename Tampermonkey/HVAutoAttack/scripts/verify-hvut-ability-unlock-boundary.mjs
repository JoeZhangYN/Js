import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const bodies = [...text.matchAll(/_ab\.unlock = async function \(name, to\) \{[\s\S]*?\n  \};/g)].map(
  (match) => match[0]
);

if (bodies.length !== 2) {
  violations.push(`${target} must keep both HVUT ability unlock segment entries visible`);
}

for (const [index, body] of bodies.entries()) {
  for (const required of [
    "if (error) {\n        popup(error);\n        return false;",
    "return true;",
    "let results;",
    "try {\n      results = await Promise.all(requests);",
    "catch (_error) {\n      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n      return;",
    "if (!results.every((r) => r)) return;",
    "reloadCurrentPage(hvutReloadReason('HV_UTILS_ABILITY_UNLOCK'))",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} ability unlock[${index}] must guard failure with ${required}`);
    }
  }
  if (/await Promise\.all\(requests\);\n\s*reloadCurrentPage/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not reload after unchecked Promise.all`);
  }
  if (/popup\(error\);\n\s*}\s*else/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not continue after HV error popup`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-ability-unlock-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-ability-unlock-boundary] OK - HVUT ability unlock failures fail closed");
