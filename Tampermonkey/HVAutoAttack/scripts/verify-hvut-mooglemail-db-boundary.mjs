import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const exportBlocks = [...text.matchAll(/export: function \(\) \{[\s\S]*?\n      \},\n      import: function/g)].map((match) => match[0]);
const importBlocks = [...text.matchAll(/import: function \(\) \{[\s\S]*?\n      \},\n      clear: async function/g)].map((match) => match[0]);
const clearBlocks = [...text.matchAll(/clear: async function \(\) \{[\s\S]*?\n      \},\n      toggle: function/g)].map((match) => match[0]);

const [modernExport, legacyExport] = exportBlocks;
const [modernImport, legacyImport] = importBlocks;
const [modernClear, legacyClear] = clearBlocks;

for (const [label, body] of [
  ["modern db export", modernExport],
  ["modern db import", modernImport],
  ["modern db clear", modernClear],
  ["legacy db export", legacyExport],
  ["legacy db import", legacyImport],
  ["legacy db clear", legacyClear],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

for (const required of [
  "const stop = function () {",
  "_mm.db.node.export.disabled = false;",
  "_mm.db.node.export.disabled = true;",
  "if (completed === 0) {\n          stop();\n          return;\n        }",
  "conn.tx.onerror = stop;",
  "conn.tx.onabort = stop;",
  "popup(`<p>The file has been saved.</p><p style=\"font-weight: bold;\">${download}</p>`);\n                stop();",
]) {
  requirePart("modern db export", modernExport, required);
}

for (const required of [
  "const stop = function () {",
  "_mm.db.node.import.disabled = false;",
  "const file = input.files[0];\n          if (!file) {\n            return;\n          }\n          if (_mm.db.node.import) {\n            _mm.db.node.import.disabled = true;",
  "reader.onerror = function () {\n            alert('读取文件失败');\n            stop();",
  "if (completed === 0) {\n              stop();\n              return;\n            }",
  "conn.tx.onerror = stop;",
  "conn.tx.onabort = stop;",
  "_mm.db.node.import.value = '完成';\n                }\n                stop();",
  "alert('解析文件失败\\n请选择一个有效的MoogleMail数据库json文件');\n            stop();",
]) {
  requirePart("modern db import", modernImport, required);
}

for (const required of [
  "const stop = function () {",
  "_mm.node.db_export.disabled = false;",
  "_mm.node.db_export.disabled = true;",
  "if (completed === 0) {\n          stop();\n          return;\n        }",
  "conn.tx.onerror = stop;",
  "conn.tx.onabort = stop;",
  "popup(`<p>文件已保存.</p><p style=\"font-weight: bold;\">${download}</p>`);\n                stop();",
]) {
  requirePart("legacy db export", legacyExport, required);
}

for (const required of [
  "const stop = function () {",
  "_mm.node.db_import.disabled = false;",
  "const file = input.files[0];\n          if (!file) {\n            return;\n          }\n          _mm.node.db_import.disabled = true;",
  "reader.onerror = function () {\n            alert('读取文件失败');\n            stop();",
  "if (completed === 0) {\n              stop();\n              return;\n            }",
  "conn.tx.onerror = stop;",
  "conn.tx.onabort = stop;",
  "_mm.node.db_import.value = '完成';\n                stop();",
  "alert('解析文件失败\\n请选择一个有效的MoogleMail数据库json文件');\n            stop();",
]) {
  requirePart("legacy db import", legacyImport, required);
}

for (const [label, body] of [
  ["modern db import", modernImport],
  ["legacy db import", legacyImport],
]) {
  if (/import\.disabled = true;[\s\S]{0,220}const file = input\.files\[0\];/.test(body)) {
    violations.push(`${target} ${label} must not disable import before a file is selected`);
  }
}

for (const required of [
  "clear: async function () {",
  "const stage = 'dbClear';",
  "const detail = { season: season };",
  "conn.os.clear();",
  "record_hvut_mooglemail_action_failure(stage, { ...detail, error: error?.message || String(error) });",
  "if (!await wait_hvut_mooglemail_db_write(stage, detail, conn)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "return true;",
]) {
  requirePart("modern db clear", modernClear, required);
}

for (const required of [
  "clear: async function () {",
  "const stage = 'legacyDbClear';",
  "const detail = { season: season };",
  "conn.os.clear();",
  "record_hvut_mooglemail_action_failure(stage, { ...detail, error: error?.message || String(error) });",
  "if (!await wait_hvut_mooglemail_db_write(stage, detail, conn)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "return true;",
]) {
  requirePart("legacy db clear", legacyClear, required);
}

for (const forbidden of [
  "clear: function () {\n        if (confirm",
  "conn.os.clear();\n        }",
]) {
  if (text.includes(forbidden)) violations.push(`${target} must not keep unchecked MoogleMail DB clear path: ${forbidden}`);
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-db-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mooglemail-db-boundary] OK - MoogleMail DB import/export/clear handles failures");
