// 反退化 probe（拆桥）：装备译名落点纪律 —— hvaaTEquip(eq …) 只许出现在「装备译名渲染族」块内。
//
// 背景：装备译名(hvaaTEquip / translateEquipName 的返回值)内含 quality/type 颜色 span(EQUIP_EQUIPS
// 字典 value 形如 'Rapier'→'<span style="background:#ffa500">西洋剑</span>（单）')，是 HTML 片段。
// 散落直插各落点曾酿两类 bug(2026-06-05 实测)：
//   ① textContent ← 译名：<span> 被转义成字面文字、背景色丢失(装备列表 <a> 显示 "&lt;span…&gt;上等…")。
//   ② confirm/alert ← 译名：纯文本对话框里显示字面 <span style=…> 标签。
// 已收口到 src/i18n/hv-utils.js 的「装备译名渲染族」(set_equip_name / equip_name_html / equip_name_text)，
// 复杂度(去标签 / 解实体 / customname 转义)下沉到族内，consumers 永不直接碰 hvaaTEquip。
//
// 本 probe 锁「不再散落」：hv-utils.js 内对 hvaaTEquip(eq …) 的直接调用只许落在
//   // >>> equip-name-render … // <<< equip-name-render
// 标记块之间(渲染族定义所在)。块外任何 hvaaTEquip(eq → 违规(应改调 set_equip_name /
// equip_name_html / equip_name_text)。bridge 定义 `hvaaTEquip = function(name){…}` 形如
// hvaaTEquip<空格>= 不含 `hvaaTEquip(eq`，不被匹配；注释内出现一律剥除不计。
//
// 设计对齐 verify-no-raw-reload / verify-no-dup-translation：剥注释逐行扫 + 命中报行号 + exit 1。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs"; // 通用 JS 注释剥离(行号保持)

const TARGET = fileURLToPath(new URL("../src/i18n/hv-utils.js", import.meta.url));
const BEGIN = ">>> equip-name-render";
const END = "<<< equip-name-render";
// 直接调用形态：hvaaTEquip( <空白> eq …。bridge 定义 `hvaaTEquip = function` 不匹配。
const RE = /\bhvaaTEquip\s*\(\s*eq/;

let src;
try {
  src = readFileSync(TARGET, "utf8");
} catch {
  console.error(`[verify-equip-name-sink] FAIL: ${TARGET} not found`);
  process.exit(1);
}

const rawLines = src.split(/\r?\n/);
const codeLines = stripComments(src).split(/\r?\n/); // 行号与 rawLines 对齐

// 标记块边界（从带注释的 rawLines 取，标记本身在注释里）。
const beginIdx = rawLines.findIndex((l) => l.includes(BEGIN));
const endIdx = rawLines.findIndex((l) => l.includes(END));
if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) {
  console.error(
    `[verify-equip-name-sink] FAIL: 渲染族标记块缺失/错位（BEGIN=${beginIdx + 1} END=${endIdx + 1}），无法判定豁免区`
  );
  process.exit(1);
}

const violations = [];
for (let i = 0; i < codeLines.length; i += 1) {
  if (!RE.test(codeLines[i])) continue;
  if (i > beginIdx && i < endIdx) continue; // 渲染族块内：合法
  violations.push({ line: i + 1 });
}

if (violations.length > 0) {
  console.error(
    `[verify-equip-name-sink] FAIL: ${violations.length} 处在渲染族块外直接调 hvaaTEquip(eq …)（译名是 HTML，按落点改调 set_equip_name / equip_name_html / equip_name_text）：`
  );
  for (const v of violations) {
    console.error(
      `  hv-utils.js:${v.line} 块外直插装备译名 → set_equip_name(el,eq) / equip_name_html(eq) / equip_name_text(eq)`
    );
  }
  process.exit(1);
}

console.log("[verify-equip-name-sink] OK — 装备译名渲染统一走渲染族（块外无直接 hvaaTEquip(eq)）");
