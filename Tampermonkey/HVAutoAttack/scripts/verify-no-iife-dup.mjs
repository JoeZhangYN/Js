// 反退化 probe（拆桥）：hv-utils.js 两 IIFE 收口对象不得回潮为各自实现。
//
// 背景：hv-utils.js 是「主世界 4.0.0 + isekai 4.2.0」双 IIFE 合并脚本。2026-06-10 应抽尽抽收口
// （继 bindTr/render_supply_li/equip-name-render 之后）把以下真重复收到守卫块共享区（L1）：
//   bindRe($re)        — 随机遭遇引擎 15 方法（RE 状态本就 'hvut_' 跨服共享，散落纯属物理）
//   bindPrice($price)  — 物价管理（上游 4.2.0 本就单实现 + IS_ISEKAI 运行时分发；数据分服、逻辑统一）
//   bindBattlePanel($battle 渲染/交互内核) — 布局 CSS 模板/DOM 构建/hover-click/三渲染原语
//     （边界 = 「仅数据分发处理和数据使用不同，外观完全一致」：数据层 Forge/Bazaar 流留各 IIFE）
//   .hvut-warn — 警示红字类归一（原主世界 .hvut-bt-warn 删）
//
// 本 probe 锁「不再散落」（铁律 1b 造抽象就要拆桥 / 铁律 4 编译期反退化）：
//   R1 两 IIFE 区内 `const $re = {` / `const $price = {` 只许空字面量 `{};`（bind 注入形态），
//      重新长出方法体 = 回潮违规。
//   R2 两 IIFE 的 $battle 字面量内不得再定义内核方法（KERNEL_METHODS 清单）。
//   R3 全文件不得再出现 'hvut-bt-warn'（类名已归一 .hvut-warn）。
//
// 输出对齐同目录 probe（verify-no-dup-translation 等）：绿 OK exit 0；命中报行号 exit 1。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const TARGET = fileURLToPath(new URL("../src/i18n/hv-utils.js", import.meta.url));
const COLLAPSED_OBJECTS = ["$re", "$price"]; // R1: 整对象收口（bindRe/bindPrice）
const KERNEL_METHODS = [ // R2: bindBattlePanel 内核方法
  "init_panel", "click", "hover", "hover_repair", "get",
  "buy_items", "buy", "render_supply_grid", "render_requirement_li", "create_equip_li",
];

const src = stripComments(readFileSync(TARGET, "utf8"));
const lines = src.split("\n");

// 定位两 IIFE 区（共享区 < isekaiStart 豁免——bind* 定义合法地住在那里）
const isekaiStart = lines.findIndex((l) => /^if \(IS_ISEKAI\) \{/.test(l));
if (isekaiStart < 0) {
  console.error("[verify-no-iife-dup] FAIL — 找不到 `if (IS_ISEKAI) {` 分发行（文件结构变更？同步更新本 probe）");
  process.exit(1);
}

const violations = [];

// R1: 收口对象在 IIFE 区只许空字面量
for (let i = isekaiStart; i < lines.length; i++) {
  for (const obj of COLLAPSED_OBJECTS) {
    if (lines[i].startsWith(`const ${obj} = {`)) {
      if (!/^const \S+ = \{\};?\s*$/.test(lines[i])) {
        violations.push(`hv-utils.js:${i + 1} ${obj} 在 IIFE 内回潮为非空字面量（应为 \`const ${obj} = {};\` + bind 注入）`);
      }
    }
  }
}

// R2: $battle 字面量内不得定义内核方法（花括号配对划定对象范围）
for (let i = isekaiStart; i < lines.length; i++) {
  if (!lines[i].startsWith("const $battle = {")) continue;
  let depth = 0;
  for (let j = i; j < lines.length; j++) {
    const m = /^ {2}([\w$]+)\s*:\s*(?:async\s+)?function/.exec(lines[j]);
    if (m && depth >= 1 && KERNEL_METHODS.includes(m[1])) {
      violations.push(`hv-utils.js:${j + 1} $battle.${m[1]} 内核方法在 IIFE 内回潮（应由 bindBattlePanel 提供）`);
    }
    for (const ch of lines[j]) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    if (j > i && depth <= 0) break;
  }
}

// R3: warn 类名不得回潮
lines.forEach((l, i) => {
  if (l.includes("hvut-bt-warn")) {
    violations.push(`hv-utils.js:${i + 1} 'hvut-bt-warn' 回潮（warn 类已归一 .hvut-warn）`);
  }
});

if (violations.length) {
  console.error("[verify-no-iife-dup] FAIL — 收口对象回潮：");
  violations.forEach((v) => console.error("  " + v));
  process.exit(1);
}
console.log("[verify-no-iife-dup] OK — 收口对象（bindRe/bindPrice/bindBattlePanel 内核/.hvut-warn）无 IIFE 回潮");
