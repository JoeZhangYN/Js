import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const requiredSnippets = [
  "CONFIRM_MOOGLEMAIL_DB_CLEAR: 'confirmMoogleMailDbClear'",
  "moogleMailDbClearConfirm: {",
  "main: '在此浏览器中选定赛季的MoogleMail记录将被删除。\\n你确定吗？'",
  "isekai: '在此浏览器中选定赛季的MoogleMail记录将被删除。\\n你确定吗？'",
  "event?.type === HVUT_FEEDBACK_EVENT.CONFIRM_MOOGLEMAIL_DB_CLEAR",
  "var confirm_hvut_mooglemail_db_clear = function () {",
  "type: HVUT_FEEDBACK_EVENT.CONFIRM_MOOGLEMAIL_DB_CLEAR",
  "copy: 'moogleMailDbClearConfirm'",
];

for (const snippet of requiredSnippets) {
  if (!text.includes(snippet)) {
    violations.push(`${target} must route MoogleMail DB clear feedback through ${snippet}`);
  }
}

const helperCalls = [...text.matchAll(/\bconfirm_hvut_mooglemail_db_clear\(\)/g)].length;
if (helperCalls !== 2) {
  violations.push(`${target} must keep exactly two MoogleMail DB clear confirmation call sites`);
}

const retired = "confirm('在此浏览器中选定赛季的MoogleMail记录将被删除。\\n你确定吗？')";
if (text.includes(retired)) {
  violations.push(`${target} must retire raw MoogleMail DB clear confirmation`);
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-db-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-mooglemail-db-feedback-boundary] OK - MoogleMail DB clear confirmation uses typed HVUT feedback"
);
