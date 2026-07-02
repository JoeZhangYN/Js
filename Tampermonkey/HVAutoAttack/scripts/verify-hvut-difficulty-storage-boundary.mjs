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

const bindDfct = body(/const bindDfct = function \(dfct, ctx\) \{[\s\S]*?\n\};\n\n\/\/ \$persona/, "bindDfct");
const init = body(/dfct\.init = function \(\) \{[\s\S]*?\n  \};\n  dfct\.create/, "dfct.init");
const change = body(/dfct\.change = async function \(value\) \{[\s\S]*?\n  \};\n  dfct\.set_button/, "dfct.change");
const setButton = body(/dfct\.set_button = function \(doc\) \{[\s\S]*?\n  \};\n\};\n\n\/\/ \$persona/, "dfct.set_button");

for (const [label, value] of [
  ["dfct.init", init],
  ["dfct.set_button", setButton],
]) {
  requireParts(label, value, [
    "if (!ctx.config.set('ch_style', ch_style)) {",
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "return false;",
  ]);
}

requireParts("dfct.init", init, [
  "dfct.node.div.addEventListener('mouseenter', dfct.create);",
  "return true;",
]);
requireParts("dfct.change", change, ["return dfct.set_button(doc);"]);
requireParts("dfct.set_button", setButton, ["return true;"]);

for (const forbidden of [
  "ctx.config.set('ch_style', ch_style);\n    }\n    dfct.node.div.addEventListener",
  "ctx.config.set('ch_style', ch_style);\n  };",
  "    dfct.set_button(doc);\n  };",
]) {
  if (bindDfct.includes(forbidden)) {
    violations.push(`${target} bindDfct must not ignore difficulty cache persistence: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-difficulty-storage-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-difficulty-storage-boundary] OK - difficulty cache storage failures fail closed");
