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

const bindRe = body(/const bindRe = function \(re, ctx\) \{[\s\S]*?\n\};\n\n\/\/ \$price/, "bindRe");
const applyState = body(/const applyEncounterState = function \(outcome\) \{[\s\S]*?\n  \};\n  re\.init/, "applyEncounterState");
const init = body(/re\.init = function \(\) \{[\s\S]*?\n  \};\n  re\.clock/, "re.init");
const clock = body(/re\.clock = function \(button\) \{[\s\S]*?\n  \};\n  re\.hv/, "re.clock");
const hv = body(/re\.hv = function \(\) \{[\s\S]*?\n  \};\n  re\.ba/, "re.hv");
const ba = body(/re\.ba = function \(\) \{[\s\S]*?\n  \};\n  re\.eh/, "re.ba");
const eh = body(/re\.eh = function \(\) \{[\s\S]*?\n  \};\n  re\.get/, "re.eh");
const load = body(/re\.load = async function \(engage\) \{[\s\S]*?\n  \};\n  re\.start/, "re.load");

requireParts("applyEncounterState", applyState, [
  "if (!ctx.config.set('re', outcome.state, 'hvut_')) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "re.json = outcome.state;",
  "return true;",
]);

requireParts("re.init", init, ["return re.get();"]);
requireParts("re.clock", clock, [
  "if (re.init() === false) return false;",
  "if (applyEncounterState(dayState) === false) return false;",
  "return true;",
]);
requireParts("re.hv", hv, [
  "if (re.init() === false) return false;",
  "if (re.check() === false) return false;",
  "return re.clock(button);",
]);
requireParts("re.ba", ba, [
  "if (re.init() === false) return false;",
  "if (re.check() === false) return false;",
  "if (re.clock(button) === false) return false;",
]);
requireParts("re.eh", eh, [
  "if (re.init() === false) return false;",
  "if (applyEncounterState(linkState) === false) return false;",
  "return re.clock(button);",
  "return true;",
]);
requireParts("re.load", load, [
  "if (re.get() === false) return false;",
  "if (applyEncounterState(outcome) === false) return false;",
  "return true;",
]);

for (const forbidden of [
  "re.json = outcome.state;\n    ctx.config.set('re', re.json, 'hvut_');",
  "ctx.config.set('re', re.json, 'hvut_');",
  "ctx.config.set('re', outcome.state, 'hvut_');\n    re.json = outcome.state;",
  "re.check();",
  "re.get();\n    re.button.textContent = '加载中...';",
]) {
  if (bindRe.includes(forbidden)) {
    violations.push(`${target} bindRe must not ignore random encounter state persistence: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-random-encounter-storage-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-random-encounter-storage-boundary] OK - random encounter state failures fail closed");
