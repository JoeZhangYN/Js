import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "src/i18n/hv-utils.js");
const diagnosticKeys = path.join(root, "src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.join(root, "src/core/diagnostic-evidence.test.js");
const text = fs.readFileSync(target, "utf8");
const diagnosticKeysText = fs.readFileSync(diagnosticKeys, "utf8");
const diagnosticTestText = fs.readFileSync(diagnosticTest, "utf8");
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
const renderBody =
  text.match(/_bottom\.render_lottery_equip_text = function \(ss, equip, lottery\) \{[\s\S]*?\n  \};/)?.[0] || "";
const failureBody =
  text.match(/_bottom\.record_lottery_notification_failure = function \(stage, ss, detail\) \{[\s\S]*?\n  \};/)?.[0] || "";
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
if (!renderBody) {
  violations.push("lottery notification equip rendering must stay isolated");
}
if (!failureBody) {
  violations.push("lottery notification failure recorder must stay explicit");
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
  "_bottom.record_lottery_notification_failure('load', ss, { error: 'missingEquipName' })",
  "const drawTime = _bottom.read_lottery_draw_time(rightpaneText, now)",
  "const prevMatch =",
  "prevMatch?.[1]",
  "eqname.previousElementSibling?.textContent",
  "let filterResult = { matched: false, error: null }",
  "filterResult = _bottom.evaluate_lottery_filter(ss, lottery.equip) || filterResult",
  "_bottom.record_lottery_notification_failure('filterDecision', ss",
  "lottery.filterError = filterResult.error",
  "const lotteryEquipText = _bottom.render_lottery_equip_text(ss, lottery.equip, lottery)",
  "_bottom.node[ss].equip.textContent = lotteryEquipText",
  "$config.set('lt_notif', json, 'hvut_')",
  "_bottom.record_lottery_notification_failure('persistence', ss",
  "_bottom.record_lottery_notification_failure('popup', ss",
  "_bottom.record_lottery_notification_failure('load', ss, { error: error?.message || String(error) })",
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
if (!lotteryRegion.includes("_bottom.node[ss].equip.textContent = _bottom.render_lottery_equip_text(ss, lottery.equip, lottery)")) {
  violations.push(`${rel(target)} lottery cached display must use safe equip rendering`);
}

for (const required of [
  "const reportErrors = (filterErrors, matched = false) =>",
  "_bottom.record_lottery_notification_failure('filter', ss",
  "const filterErrors = []",
  "const result = $equip.filter.match($config.settings.lotteryFilters, equip)",
  "const matched = result.matched",
  "filterErrors.push(...result.errors)",
  "return reportErrors(filterErrors, matched)",
  "filter: '<lotteryFilters>'",
  "errors: filterErrors",
  "matched,",
  "return reportErrors(filterErrors, false)",
  "error: (Array.isArray(filterErrors) ? filterErrors : [])",
]) {
  if (!filterBody.includes(required)) {
    violations.push(`${rel(target)} lottery filter decision must include ${required}`);
  }
}

for (const required of [
  "_bottom.read_lottery_draw_time = function (text, now)",
  "drawTimeNotFound",
  "const drawTime = _bottom.read_lottery_draw_time(rightpaneText, now)",
  "lottery.dateError = drawTime.error || null",
  "drawTime.known ? time_format(lottery.date - now, 1) : '--:--'",
]) {
  if (!lotteryRegion.includes(required)) {
    violations.push(`${rel(target)} lottery draw-time parsing must preserve equipment display with ${required}`);
  }
}

for (const required of [
  "try {",
  "catch (error)",
  "const renderError = error?.message || String(error)",
  "lottery.renderError = renderError",
  "_bottom.record_lottery_notification_failure('equipRender', ss",
  "return String(equip ?? '')",
]) {
  if (!renderBody.includes(required)) {
    violations.push(`${rel(target)} lottery equip renderer must include ${required}`);
  }
}

for (const required of [
  "capability: 'lotteryNotification'",
  "sessionStorage.setItem('HVAA:lastLotteryNotificationFailure'",
  "console.warn('[HVUT] lottery notification failed', evidence)",
  "Console hooks must not block lottery notification fallback.",
]) {
  if (!failureBody.includes(required)) {
    violations.push(`${rel(target)} lottery failure recorder must include ${required}`);
  }
}

for (const required of [
  "LOTTERY_NOTIFICATION_FAILURE: \"HVAA:lastLotteryNotificationFailure\"",
  "source(\"lotteryNotificationFailure\", DiagnosticEvidenceKey.LOTTERY_NOTIFICATION_FAILURE)",
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${rel(diagnosticKeys)} must expose ${required}`);
  }
}
for (const required of [
  "HVAA:lastLotteryNotificationFailure",
  "lotteryNotificationFailure: { capability: \"lotteryNotification\", stage: \"load\" }",
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${rel(diagnosticTest)} must cover ${required}`);
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
  "_bottom.node[ss].equip.textContent = equip_name_text_str(lottery.equip)",
  "popup(`<p>${date_text}</p><p style=\"color: #f00; font-weight: bold;\">${equip_name_text_str(lottery.equip)}</p>`)",
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
