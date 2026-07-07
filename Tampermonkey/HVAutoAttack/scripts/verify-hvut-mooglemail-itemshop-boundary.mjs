import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const itemshopBody =
  /_mm\.itemshop = async function \(mid, items\) \{[\s\S]*?\n    \};\n\n    \/\/ 代重铸服务/.exec(text)?.[0] || "";

if (!itemshopBody) {
  violations.push(`${target} must keep MoogleMail itemshop workflow visible`);
} else {
  for (const required of [
    "const stop = function () {",
    "_mm.itemshop.current = null;",
    "return false;",
    "const attachRemoveResponse = await _mm.mail_load(mid, `action=attach_remove&mmtoken=${_mm.mmtoken}`);",
    "if (attachRemoveResponse.kind === 'rejected') {",
    "_mm.mail_log('!!! Error: 接收失败');",
    "return stop();",
    "const result = await $item.buy(items);",
    "if (!result) {\n        return stop();",
    "await $mail.request(mail);",
  ]) {
    if (!itemshopBody.includes(required)) {
      violations.push(`${target} MoogleMail itemshop workflow must preserve ${required}`);
    }
  }
  for (const forbidden of [
    "_mm.itemshop.current = mid;\n\n      _mm.mail_log('[系统店代购]', true);",
    "await _mm.mail_load(mid, `action=attach_remove&mmtoken=${_mm.mmtoken}`);\n      _mm.mail_log('购买');",
    "if (!await _mm.mail_load(mid, `action=attach_remove&mmtoken=${_mm.mmtoken}`)) {",
    "if (!result) {\n        return;\n      }",
    "$mail.request(mail);\n    };",
  ]) {
    if (itemshopBody.includes(forbidden)) {
      violations.push(`${target} MoogleMail itemshop workflow must not keep unchecked path: ${forbidden}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-itemshop-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mooglemail-itemshop-boundary] OK - MoogleMail itemshop workflow stops on failed side effects");
