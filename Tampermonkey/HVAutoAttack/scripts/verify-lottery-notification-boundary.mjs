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
const stateBody =
  text.match(/_bottom\.read_lottery_state = function \(ss\) \{[\s\S]*?\n  \};/)?.[0] || "";
const filterBody =
  text.match(/_bottom\.evaluate_lottery_filter = function \(ss, equip\) \{[\s\S]*?\n  \};/)?.[0] || "";
const lotteryRegion = text.match(/\/\/ LOTTERY[\s\S]*?\n\n\/\/\* \[1\] Character/)?.[0] || "";

if (!body) {
  violations.push("lottery notification loader must stay explicit");
}
if (!stateBody) {
  violations.push("lottery notification state reader must stay explicit");
}
if (!filterBody) {
  violations.push("lottery notification filter decision must stay isolated");
}
if (!lotteryRegion) {
  violations.push("lottery notification region must stay explicit");
}

for (const required of [
  "const json = $config.get('lt_notif', { lt: {}, la: {} }, 'hvut_') || {}",
  "if (!json.lt || typeof json.lt !== 'object') json.lt = {}",
  "if (!json.la || typeof json.la !== 'object') json.la = {}",
  "if (!json[ss] || typeof json[ss] !== 'object') json[ss] = {}",
  "return { json, lottery: json[ss] }",
]) {
  if (!stateBody.includes(required)) {
    violations.push(`${rel(target)} lottery state reader must include ${required}`);
  }
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
  "let filterResult = { matched: false, error: null }",
  "filterResult = _bottom.evaluate_lottery_filter(ss, lottery.equip) || filterResult",
  "console.warn('[HVUT] lottery notification filter decision failed'",
  "lottery.filterError = filterResult.error",
  "_bottom.node[ss].equip.textContent = equip_name_text_str(lottery.equip)",
  "$config.set('lt_notif', json, 'hvut_')",
  "console.warn('[HVUT] lottery notification persistence failed'",
  "console.warn('[HVUT] lottery notification popup failed'",
]) {
  if (!body.includes(required)) {
    violations.push(`${rel(target)} lottery loader must include ${required}`);
  }
}

if (!lotteryRegion.includes("const { lottery } = _bottom.read_lottery_state(ss)")) {
  violations.push(`${rel(target)} lottery display must read initialized lottery state`);
}
if (!lotteryRegion.includes("const { json, lottery } = _bottom.read_lottery_state(ss)")) {
  violations.push(`${rel(target)} lottery loader must read initialized lottery state`);
}

for (const required of [
  "const failClosed = (filterErrors) =>",
  "Console hooks must not block lottery equipment display.",
  "const filterErrors = []",
  "const result = $equip.filter.match($config.settings.lotteryFilters, equip)",
  "const matched = result.matched",
  "filterErrors.push(...result.errors)",
  "return failClosed(filterErrors)",
  "filter: '<lotteryFilters>'",
  "console.warn('[HVUT] lottery notification filter failed'",
  "errors: filterErrors",
  "matched,",
  "matched: false,",
  "error: (Array.isArray(filterErrors) ? filterErrors : [])",
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
  "$equip.filter.equip($config.settings.lotteryFilters, equip)",
  "$equip.filter.test(filter, null, equip)",
  "$equip.filter.test(",
  "filters.some((filter) =>",
  "const filters = $equip.filter.normalize($config.settings.lotteryFilters)",
  "Array.isArray($config.settings.lotteryFilters) ? $config.settings.lotteryFilters : [$config.settings.lotteryFilters]",
]) {
  if (lotteryRegion.includes(forbidden)) {
    violations.push(`${rel(target)} lottery filter boundary must not use brittle parser path: ${forbidden}`);
  }
}

if (lotteryRegion.includes("$equip.filter.equip(")) {
  violations.push(`${rel(target)} lottery notification must not call generic equipment filter boolean entry`);
}
if (!lotteryRegion.includes("$equip.filter.match($config.settings.lotteryFilters, equip)")) {
  violations.push(`${rel(target)} lottery notification must use the match decision with structured filter errors`);
}

if (violations.length) {
  console.error("[verify-lottery-notification-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-lottery-notification-boundary] OK - lottery notification loader fails closed");
