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

const bindTr = body(/const bindTr = function \(tr, ctx\) \{[\s\S]*?\n\};\n\n\/\/ \$re/, "bindTr");
const setBody = body(/tr\.set = function \(reload\) \{[\s\S]*?\n  \};\n\n  tr\.cancel/, "tr.set");
const cancelBody = body(
  /tr\.cancel = function \(reload\) \{[\s\S]*?\n  \};\n\};\n\n\/\/ \$re/,
  "tr.cancel"
);

requireParts("tr.set", setBody, [
  "if (!ctx.config.set('tr_notif', tr.json, 'hvut_')) {",
  "show_hvut_generic_error();",
  "return false;",
  "reloadCurrentPage(hvutReloadReason('HV_UTILS_TRAINING_NOTIFICATION'))",
  "return true;",
]);

requireParts("tr.cancel", cancelBody, ["return tr.set(reload);"]);

for (const forbidden of [
  "ctx.config.set('tr_notif', tr.json, 'hvut_');\n\n    if (reload)",
  "    tr.set(reload);\n  };",
]) {
  if (bindTr.includes(forbidden)) {
    violations.push(`${target} bindTr must not ignore training notification persistence result`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-training-notification-storage-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-training-notification-storage-boundary] OK - training notification storage failures fail closed"
);
