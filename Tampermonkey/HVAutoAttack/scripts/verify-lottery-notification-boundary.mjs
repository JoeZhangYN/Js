import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "src/i18n/hv-utils.js");
const text = fs.readFileSync(target, "utf8");
const violations = [];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

const body =
  text.match(/_bottom\.load_lottery = async function \(ss\) \{[\s\S]*?\n  \};/)?.[0] || "";
const filterBody =
  text.match(/_bottom\.evaluate_lottery_filter = function \(ss, equip\) \{[\s\S]*?\n  \};/)?.[0] || "";

if (!body) {
  violations.push("lottery notification loader must stay explicit");
}
if (!filterBody) {
  violations.push("lottery notification filter decision must stay isolated");
}

for (const required of [
  "try {",
  "catch (error)",
  "加载失败",
  "console.warn('[HVUT] lottery notification failed'",
  "const drawMatch =",
  "const prevMatch =",
  "prevMatch?.[1]",
  "eqname.previousElementSibling?.textContent",
  "const filterResult = _bottom.evaluate_lottery_filter(ss, lottery.equip)",
  "lottery.filterError = filterResult.error",
]) {
  if (!body.includes(required)) {
    violations.push(`${rel(target)} lottery loader must include ${required}`);
  }
}

for (const required of [
  "try {",
  "catch (error)",
  "$equip.filter.equip($config.settings.lotteryFilters, equip)",
  "console.warn('[HVUT] lottery notification filter failed'",
  "matched: false",
]) {
  if (!filterBody.includes(required)) {
    violations.push(`${rel(target)} lottery filter decision must include ${required}`);
  }
}

for (const forbidden of [
  "throw new Error('分析错误')",
  "RegExp.$1",
  "RegExp.$2",
  ".exec($qs('img[src*=\"lottery_prev_a.png\"]', doc)?.getAttribute('onclick'))[1]",
  "lottery.check = $equip.filter.equip",
]) {
  if (body.includes(forbidden)) {
    violations.push(`${rel(target)} lottery loader must not use brittle parser path: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-lottery-notification-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-lottery-notification-boundary] OK - lottery notification loader fails closed");
