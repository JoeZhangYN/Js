import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const requiredSnippets = [
  "CONFIRM_MOOGLEMAIL_DB_CLEAR: 'confirmMoogleMailDbClear'",
  "ALERT_MOOGLEMAIL_DB_IMPORT_READ_FAILED: 'alertMoogleMailDbImportReadFailed'",
  "ALERT_MOOGLEMAIL_DB_IMPORT_PARSE_FAILED: 'alertMoogleMailDbImportParseFailed'",
  "moogleMailDbClearConfirm: {",
  "main: '在此浏览器中选定赛季的MoogleMail记录将被删除。\\n你确定吗？'",
  "isekai: '在此浏览器中选定赛季的MoogleMail记录将被删除。\\n你确定吗？'",
  "moogleMailDbImportReadFailedAlert: {\n      main: '读取文件失败',\n      isekai: '读取文件失败',\n    }",
  "moogleMailDbImportParseFailedAlert: {\n      main: '解析文件失败\\n请选择一个有效的MoogleMail数据库json文件',\n      isekai: '解析文件失败\\n请选择一个有效的MoogleMail数据库json文件',\n    }",
  "event?.type === HVUT_FEEDBACK_EVENT.CONFIRM_MOOGLEMAIL_DB_CLEAR",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_DB_IMPORT_READ_FAILED",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_DB_IMPORT_PARSE_FAILED",
  "var confirm_hvut_mooglemail_db_clear = function () {",
  "type: HVUT_FEEDBACK_EVENT.CONFIRM_MOOGLEMAIL_DB_CLEAR",
  "copy: 'moogleMailDbClearConfirm'",
  "var alert_hvut_mooglemail_db_import_read_failed = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_DB_IMPORT_READ_FAILED",
  "copy: 'moogleMailDbImportReadFailedAlert'",
  "var alert_hvut_mooglemail_db_import_parse_failed = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_DB_IMPORT_PARSE_FAILED",
  "copy: 'moogleMailDbImportParseFailedAlert'",
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

const readAlertCalls = [...text.matchAll(/\balert_hvut_mooglemail_db_import_read_failed\(\)/g)]
  .length;
if (readAlertCalls !== 2) {
  violations.push(
    `${target} must keep exactly two MoogleMail DB import read-failure alert call sites`
  );
}

const parseAlertCalls = [...text.matchAll(/\balert_hvut_mooglemail_db_import_parse_failed\(\)/g)]
  .length;
if (parseAlertCalls !== 2) {
  violations.push(
    `${target} must keep exactly two MoogleMail DB import parse-failure alert call sites`
  );
}

for (const retired of [
  "confirm('在此浏览器中选定赛季的MoogleMail记录将被删除。\\n你确定吗？')",
  "alert('读取文件失败')",
  "alert('解析文件失败\\n请选择一个有效的MoogleMail数据库json文件')",
  "console.log('无效的数据库')",
  "console.log('无效的对象存储')",
]) {
  if (text.includes(retired)) {
    violations.push(`${target} must retire raw MoogleMail DB feedback/diagnostic: ${retired}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-db-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-mooglemail-db-feedback-boundary] OK - MoogleMail DB clear confirmation uses typed HVUT feedback"
);
