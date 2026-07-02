// 校验 dist/HVAutoAttack.user.js 产物完整性。
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/HVAutoAttack.user.js", import.meta.url));

let src;
try {
  src = readFileSync(DIST, "utf8");
} catch {
  console.error(`[postbuild-check] FAIL: ${DIST} not found`);
  process.exit(1);
}

const errors = [];
const lotteryRegion =
  src.match(/if \(\$config\.settings\.lotteryNotification\) \{[\s\S]*?\n            \$element\("div", _bottom\.node\.div, \["\.hvut-spaceholder"\]\);[\s\S]*?\n          \}/)?.[0] || "";

// 1. UserScript metadata block 配对
if (!src.includes("// ==UserScript==")) errors.push("missing `// ==UserScript==`");
if (!src.includes("// ==/UserScript==")) errors.push("missing `// ==/UserScript==`");

// 2. @match 必须含 HV 持久 + 异世界
if (!/@match\s+http\*?:\/\/hentaiverse\.org\/\*/.test(src))
  errors.push("@match missing `hentaiverse.org/*`");
if (!/@match\s+http:\/\/alt\.hentaiverse\.org\/\*/.test(src))
  errors.push("@match missing `alt.hentaiverse.org/*`");

// 3. 文件大小合理
const size = statSync(DIST).size;
// 上限 2.5MB：整合 HV Utils 统一汉化(~893KB) + indefined 装备汉化 #404119 + 界面汉化 #404118(词典 ~3568 行)
// 后单脚本实测 ~1.79MB(minify:false 不压缩)；2.5MB 预留繁简表/dict-store 第二批 + 未来空间，仍能拦截误打包 node_modules 级膨胀。
if (size < 50_000 || size > 2_500_000) {
  errors.push(`size ${size} bytes out of 50KB-2.5MB range`);
}

// 4. 不含 dev metadata 残留
if (/localhost|127\.0\.0\.1/.test(src)) {
  errors.push("contains `localhost` or `127.0.0.1` (dev metadata leaked into prod)");
}

// 5. 产物不能含动态代码执行；源码侧由 verify-no-eval 先拦，这里防打包产物回退。
if (/\beval\s*\(/.test(src)) {
  errors.push("contains `eval(`; route dynamic rules through typed parsers");
}
if (/\bnew\s+Function\s*\(/.test(src)) {
  errors.push("contains `new Function(`; route dynamic rules through typed parsers");
}

// 5b. 通用 HVUT 装备过滤必须保留结构化失败证据。调用方仍拿布尔结果，
// 但过滤器错误和运行时崩溃不能退回 console-only。
for (const required of [
  "recordFailure: function(stage, detail)",
  "capability: \"equipmentFilter\"",
  'sessionStorage.setItem("HVAA:lastEquipmentFilterFailure"',
  '$equip.filter.recordFailure("match", { equip: result.name, errors: result.errors })',
]) {
  if (!src.includes(required)) errors.push(`equipment filter artifact missing ${required}`);
}
if (
  !/\$equip\.filter\.recordFailure\("runtime", \{ equip: equip\d*, error: error\?\.message \|\| String\(error\) \}\)/.test(src)
) {
  errors.push("equipment filter artifact missing runtime failure evidence");
}

// 6. @grant 必须列全 5 项
for (const g of ["GM_setValue", "GM_getValue", "GM_deleteValue", "GM_notification", "unsafeWindow"]) {
  if (!new RegExp(`@grant\\s+${g}\\b`).test(src)) errors.push(`@grant missing ${g}`);
}

// 7. 彩票通知必须通过隔离过滤入口。历史回退路径会让一条坏过滤器抛出 Invalid Filter，
// 导致 bottom bar 长留“加载中...”。
for (const required of [
  "_bottom.read_lottery_state = function(ss)",
  'const json = $config.get("lt_notif", { lt: {}, la: {} }, "hvut_") || {}',
  "if (!json.lt || typeof json.lt !== \"object\") json.lt = {}",
  "if (!json.la || typeof json.la !== \"object\") json.la = {}",
  "if (!json[ss] || typeof json[ss] !== \"object\") json[ss] = {}",
  "return { json, lottery: json[ss] }",
  "_bottom.evaluate_lottery_filter = function(ss, equip)",
  "_bottom.record_lottery_notification_failure = function(stage, ss, detail)",
  "capability: \"lotteryNotification\"",
  'sessionStorage.setItem("HVAA:lastLotteryNotificationFailure"',
  "const reportErrors =",
  "const result = $equip.filter.match($config.settings.lotteryFilters, equip)",
  "filterErrors.push(...result.errors)",
  "return reportErrors(filterErrors, matched)",
  "filter: \"<lotteryFilters>\"",
  "matched: false",
  "_bottom.render_lottery_equip_text = function(ss, equip, lottery)",
  "_bottom.read_lottery_draw_time = function(text, now)",
  "drawTimeNotFound",
  "lottery.renderError = renderError",
  '_bottom.record_lottery_notification_failure("equipRender", ss',
  "return String(equip ?? \"\")",
  "let filterResult = { matched: false, error: null }",
  "filterResult = _bottom.evaluate_lottery_filter(ss, lottery.equip) || filterResult",
  '_bottom.record_lottery_notification_failure("filterDecision", ss',
  "lottery.filterError = filterResult.error",
  "_bottom.node[ss].equip.textContent = _bottom.render_lottery_equip_text(ss, lottery.equip, lottery)",
  "const lotteryEquipText = _bottom.render_lottery_equip_text(ss, lottery.equip, lottery)",
  "_bottom.node[ss].equip.textContent = lotteryEquipText",
  '$config.set("lt_notif", json, "hvut_")',
  '_bottom.record_lottery_notification_failure("persistence", ss',
  '_bottom.record_lottery_notification_failure("popup", ss',
  '_bottom.record_lottery_notification_failure("load", ss',
]) {
  if (!src.includes(required)) errors.push(`lottery artifact missing ${required}`);
}
if (!lotteryRegion.includes("const { lottery } = _bottom.read_lottery_state(ss)")) {
  errors.push("lottery artifact display must read initialized lottery state");
}
if (!lotteryRegion.includes("const { json, lottery } = _bottom.read_lottery_state(ss)")) {
  errors.push("lottery artifact loader must read initialized lottery state");
}
if (!lotteryRegion) {
  errors.push("lottery artifact region missing");
}
for (const forbidden of [
  "lottery.check = $equip.filter.equip",
  "$equip.filter.equip($config.settings.lotteryFilters, equip)",
  "$equip.filter.test(filter, null, equip)",
  "$equip.filter.test(",
  "const filters = $equip.filter.normalize($config.settings.lotteryFilters)",
  "Array.isArray($config.settings.lotteryFilters) ? $config.settings.lotteryFilters : [$config.settings.lotteryFilters]",
  "Array.isArray($config.settings.lotteryFilters)?$config.settings.lotteryFilters:[$config.settings.lotteryFilters]",
  "_bottom.node[ss].equip.textContent = equip_name_text_str(lottery.equip)",
  'popup(`<p>${date_text}</p><p style="color: #f00; font-weight: bold;">${equip_name_text_str(lottery.equip)}</p>`)',
]) {
  if (lotteryRegion.includes(forbidden)) {
    errors.push(`lottery artifact uses old filter path: ${forbidden}`);
  }
}
if (lotteryRegion.includes("$equip.filter.equip(")) {
  errors.push("lottery artifact must not call generic equipment filter boolean entry");
}
if (!lotteryRegion.includes("$equip.filter.match($config.settings.lotteryFilters, equip)")) {
  errors.push("lottery artifact must use the match decision with structured filter errors");
}

if (errors.length > 0) {
  console.error("[postbuild-check] FAIL:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`[postbuild-check] OK — ${(size / 1024).toFixed(1)} KB`);
