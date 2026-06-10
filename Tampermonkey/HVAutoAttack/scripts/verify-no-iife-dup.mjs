// 反退化 probe（拆桥）：hv-utils.js 两 IIFE 收口对象不得回潮为各自实现。
//
// 背景：hv-utils.js 是「主世界 4.0.0 + isekai 4.2.0」双 IIFE 合并脚本。2026-06-10 应抽尽抽收口
// （继 bindTr/render_supply_li/equip-name-render 之后）把以下真重复收到守卫块共享区（L1）：
//   bindRe($re)        — 随机遭遇引擎 15 方法（RE 状态本就 'hvut_' 跨服共享，散落纯属物理）
//   bindPrice($price)  — 物价管理（上游 4.2.0 本就单实现 + IS_ISEKAI 运行时分发；数据分服、逻辑统一）
//   bindDfct($dfct)    — 难度切换 4 方法（"被 topmenu node 形态阻塞"已证伪，纯表层漂移）
//   bindPersona($persona) — 角色/装备套装切换 12/13 方法（真分叉经 ctx 倒置: warnSelector/
//     parseEquipElem/applyDynjs；parse_stats_pane 解析模型大分叉留各 IIFE 字面量）
//   bindBattlePanel($battle 渲染/交互内核) — 布局 CSS 模板/DOM 构建/hover-click/三渲染原语
//     （边界 = 「仅数据分发处理和数据使用不同，外观完全一致」：数据层 Forge/Bazaar 流留各 IIFE）
//   .hvut-warn/.hvut-bonus — 警示/增益色类归一（原主世界 .hvut-bt-warn/inline style 删）
//
// 本 probe 锁「不再散落」（铁律 1b 造抽象就要拆桥 / 铁律 4 编译期反退化）：
//   R1 两 IIFE 区内 COLLAPSED_OBJECTS 只许空字面量 `{};`（bind 注入形态），重新长出方法体 = 回潮违规。
//   R2 两 IIFE 的 PARTIAL_OBJECTS 字面量内不得再定义已收口方法（各对象的 kernel 清单）。
//   R3 全文件字面量禁词（BANNED_LITERALS，注释行豁免）：
//      'hvut-bt-warn' — 类名已归一 .hvut-warn；
//      'dynjs_loaded' — 能量模型后 dynjs 文件统一 `dynjs_equip = {...};`，旧整体替换容器已拆桥
//        （2026-06-10，内联 script 变量提取统一走 L1 parse_script_json）。
//
// 输出对齐同目录 probe（verify-no-dup-translation 等）：绿 OK exit 0；命中报行号 exit 1。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const TARGET = fileURLToPath(new URL("../src/i18n/hv-utils.js", import.meta.url));
const COLLAPSED_OBJECTS = ["$re", "$price", "$dfct"]; // R1: 整对象收口（bindRe/bindPrice/bindDfct）
const PARTIAL_OBJECTS = { // R2: 部分收口对象 → 字面量内禁止回潮的方法名
  "$battle": [ // bindBattlePanel 内核 + 数据层(2026-06-10 续收: 能量模型后两版修理机制同构, Forge 流已死)
    "init_panel", "click", "hover", "hover_repair", "get",
    "buy_items", "buy", "render_supply_grid", "render_requirement_li", "create_equip_li",
    "create", "load_dynjs", "update_condition", "repair", "calc_repair", "load_repair",
    "update_link", "load_items", "load", "parse", "display_condition", "load_inventory",
    "display_inventory", "render_repair",
  ],
  "$persona": [ // bindPersona（字面量仅许 parse_stats_pane）
    "init", "create", "check_p", "check_e", "change_p", "change_e",
    "set_button", "load_dynjs", "set_value", "get_value", "save_equipset", "check_warning",
  ],
};

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

// R2: 部分收口对象的字面量内不得定义已收口方法（花括号配对划定对象范围）
for (let i = isekaiStart; i < lines.length; i++) {
  for (const [obj, kernel] of Object.entries(PARTIAL_OBJECTS)) {
    if (!lines[i].startsWith(`const ${obj} = {`)) continue;
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      const m = /^ {2}([\w$]+)\s*:\s*(?:async\s+)?function/.exec(lines[j]);
      if (m && depth >= 1 && kernel.includes(m[1])) {
        violations.push(`hv-utils.js:${j + 1} ${obj}.${m[1]} 已收口方法在 IIFE 内回潮（应由 bind 内核提供）`);
      }
      for (const ch of lines[j]) {
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
      }
      if (j > i && depth <= 0) break;
    }
  }
}

// R3: 字面量禁词不得回潮（src 已 stripComments，注释里的拆桥说明天然豁免）
const BANNED_LITERALS = [
  ["hvut-bt-warn", "warn 类已归一 .hvut-warn"],
  ["dynjs_loaded", "dynjs 已统一 dynjs_equip（L1 parse_script_json），旧整体替换容器已拆桥"],
  ["?s=Forge&ss=re", "旧 Bazaar Forge 修理页已随能量模型消失，修理统一走 ?s=Bazaar&ss=am&screen=repair（bindBattlePanel 数据层）"],
];
lines.forEach((l, i) => {
  for (const [word, why] of BANNED_LITERALS) {
    if (l.includes(word)) {
      violations.push(`hv-utils.js:${i + 1} '${word}' 回潮（${why}）`);
    }
  }
});

if (violations.length) {
  console.error("[verify-no-iife-dup] FAIL — 收口对象回潮：");
  violations.forEach((v) => console.error("  " + v));
  process.exit(1);
}
console.log("[verify-no-iife-dup] OK — 收口对象（bindRe/bindPrice/bindDfct/bindPersona/bindBattlePanel 内核/禁词 hvut-bt-warn·dynjs_loaded）无 IIFE 回潮");
