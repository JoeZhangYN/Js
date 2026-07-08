import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

function requireCount(label, part, expected) {
  const actual = text.split(part).length - 1;
  if (actual !== expected) {
    violations.push(`${target} ${label} must appear ${expected} time(s), found ${actual}: ${part}`);
  }
}

const trainingParse =
  /_tr\.parse_progress = function \(\) \{[\s\S]*?\n  \};\n\n  GM_addStyle/.exec(text)?.[0] || "";
const legacyTraining =
  /_tr\.json\.error = '';[\s\S]*?\n\} else\n\/\/ \[END 4\] Character - Training/.exec(text)?.[0] ||
  "";
const bottomTraining =
  /_bottom\.tr = \{[\s\S]*?\n  \};\n\n  _bottom\.tr\.init\(\);/.exec(text)?.[0] || "";
const lotteryLoader =
  /_bottom\.load_lottery = async function \(ss\) \{[\s\S]*?\n  \};\n\n  \$element\('div', _bottom\.node\.div/.exec(
    text
  )?.[0] || "";
const lotteryToggles = text.match(/_lt\.toggle = function \(show\) \{[\s\S]*?\n    \};/g) || [];

if (!trainingParse) violations.push(`${target} must keep training parse_progress entry visible`);
if (!legacyTraining)
  violations.push(`${target} must keep legacy training notification persistence visible`);
if (!bottomTraining)
  violations.push(`${target} must keep bottom training notification entry visible`);
if (!lotteryLoader) violations.push(`${target} must keep lottery notification loader visible`);
if (lotteryToggles.length !== 2)
  violations.push(`${target} must keep two lottery toggle entries visible`);

for (const [label, body] of [
  ["training parse_progress", trainingParse],
  ["legacy training notification", legacyTraining],
]) {
  for (const part of [
    "if (!$config.set('tr_notif', _tr.json, 'hvut_')) {",
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "return false;",
  ]) {
    requirePart(label, body, part);
  }
}

for (const part of [
  "if (!$config.set('tr_notif', json, 'hvut_')) {",
  "json.error = '保存训练通知失败';",
  "_bottom.tr.node.link.textContent = json.error;",
  "return false;",
  "return true;",
]) {
  requirePart("bottom training notification", bottomTraining, part);
}

for (const part of [
  "if (!$config.set('lt_notif', json, 'hvut_')) {",
  "lottery.persistenceError = 'configWriteFailed';",
  "_bottom.record_lottery_notification_failure('persistence', ss, { error: lottery.persistenceError });",
  "return false;",
]) {
  requirePart("lottery loader persistence", lotteryLoader, part);
}

for (const [index, body] of lotteryToggles.entries()) {
  for (const part of [
    "const previous = _lt.json[lotteryPage.ss].hide;",
    "if (!$config.set('lt_notif', _lt.json, 'hvut_')) {",
    "_lt.json[lotteryPage.ss].hide = previous;",
    "show_hvut_config_storage_failure_report('lotteryNotificationToggle', { key: 'lt_notif', page: lotteryPage.ss });",
    "return false;",
    "return true;",
  ]) {
    requirePart(`lottery toggle ${index + 1}`, body, part);
  }
}

requireCount(
  "training notification parse guard",
  "if (!$config.set('tr_notif', _tr.json, 'hvut_')) {",
  2
);
requireCount("lottery toggle guard", "if (!$config.set('lt_notif', _lt.json, 'hvut_')) {", 2);

for (const [label, body, forbidden] of [
  ["training parse_progress", trainingParse, "$config.set('tr_notif', _tr.json, 'hvut_');"],
  ["legacy training notification", legacyTraining, "$config.set('tr_notif', _tr.json, 'hvut_');"],
  ["bottom training notification", bottomTraining, "$config.set('tr_notif', json, 'hvut_');"],
  ["lottery loader persistence", lotteryLoader, "$config.set('lt_notif', json, 'hvut_');"],
  ["lottery toggle", lotteryToggles.join("\n"), "$config.set('lt_notif', _lt.json, 'hvut_');"],
]) {
  if (body.includes(forbidden)) {
    violations.push(
      `${target} ${label} must not ignore notification persistence result: ${forbidden}`
    );
  }
}

if (violations.length) {
  console.error("[verify-hvut-notification-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-notification-persistence-boundary] OK - notification persistence failures fail closed"
);
