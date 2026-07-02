// 反退化 probe（拆桥）：禁止 page-kind.js 外用「无歧义的页面类型检测惯用式」，统一走 runPageKindAutomation(event)。
//
// 背景：runPageKindAutomation(event)（src/pages/page-kind.js）是页面类型判定单一 SOT，曾是零调用方贫血孤岛；
// init.js 已改为消费它（de-island）。本 probe 锁「检测不再散落」。
//
// 设计取舍（精度优先，窄匹配避噪 —— 信号承载形态契约：持久 probe 须精度高/解决便宜/豁免不静默）：
//   - 只禁两种**无歧义即检测**的惯用式：
//       ① host 等值 `=== "e-hentai.org"`（引号紧裹 host；不匹配 `"https://e-hentai.org/news.php"` 这类完整 URL）
//       ② 三哨兵复合 `#navbar,#riddlecounter,#textlog`（「是否任一游戏页」的检测复合，绝不会是值读）
//   - **不禁**单哨兵（`#riddlecounter` 等可能是读计时器值 / 读响应文档，如 riddle.js / action event bridge），
//     禁了会假阳违反精度契约；单哨兵检测靠 page-kind SOT + 注释约定治理。
//   - 豁免 page-kind.js（页面类型入口实现所在）。
//
// 输出对齐同目录 probe：命中逐条 + exit 1。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
// 豁免：page-kind.js（SOT 实现）+ 第三方移植脚本（hv-utils 等 sloppy-mode 不能 ESM import page-kind，
// 其 e-hentai 检测是自身 news.php 功能的独立逻辑，非 HVAA 页面分发，不纳入 SOT 收口）。
const EXEMPT = [
  "pages/page-kind.js",
  "i18n/hv-utils.js",
  "i18n/equip-translate.js",
  "i18n/interface-translate.js",
  "i18n/jpx-lang.js",
];
const RULES = [
  {
    re: /===\s*["']e-hentai\.org["']/,
    hint: 'host 检测 `=== "e-hentai.org"` → runPageKindAutomation(event)===PageKind.EHENTAI',
  },
  {
    re: /#navbar,#riddlecounter,#textlog/,
    hint: "三哨兵复合检测 → runPageKindAutomation(event) 判 RIDDLE/BATTLE/LOBBY/UNKNOWN",
  },
];

function collectJs(dir, base = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const abs = `${dir}/${name}`;
    const rel = base ? `${base}/${name}` : name;
    if (statSync(abs).isDirectory()) {
      out.push(...collectJs(abs, rel));
    } else if (name.endsWith(".js")) {
      out.push({ abs, rel });
    }
  }
  return out;
}

const violations = [];
for (const { abs, rel } of collectJs(SRC_DIR)) {
  if (EXEMPT.includes(rel)) continue;
  const codeLines = stripComments(readFileSync(abs, "utf8")).split(/\r?\n/);
  for (let i = 0; i < codeLines.length; i += 1) {
    if (/\bdetectPageKind\b/.test(codeLines[i])) {
      violations.push({
        rel,
        line: i + 1,
        hint: "legacy detectPageKind reference is forbidden; use runPageKindAutomation(event)",
      });
    }
    for (const { re, hint } of RULES) {
      if (re.test(codeLines[i])) {
        violations.push({ rel, line: i + 1, hint });
      }
    }
  }
}

const ownerText = readFileSync(`${SRC_DIR}/pages/page-kind.js`, "utf8");
if (!/\bexport\s+const\s+PageKindEvent\b/.test(ownerText)) {
  violations.push({ rel: "pages/page-kind.js", line: 1, hint: "must expose PageKindEvent" });
}
if (!/\bexport\s+function\s+runPageKindAutomation\s*\(/.test(ownerText)) {
  violations.push({
    rel: "pages/page-kind.js",
    line: 1,
    hint: "must expose runPageKindAutomation(event)",
  });
}
if (/\bexport\s+function\s+detectPageKind\s*\(/.test(ownerText)) {
  violations.push({
    rel: "pages/page-kind.js",
    line: 1,
    hint: "legacy detectPageKind export is forbidden",
  });
}
if (!ownerText.includes("const pageKindEventHandlers")) {
  violations.push({
    rel: "pages/page-kind.js",
    line: 1,
    hint: "must route page-kind events through a handler table",
  });
}
const ownerEntry = ownerText.match(/export function runPageKindAutomation[\s\S]*?\n}/)?.[0] || "";
if (ownerEntry.includes("event.type")) {
  violations.push({
    rel: "pages/page-kind.js",
    line: 1,
    hint: "runPageKindAutomation(event) must reject null events without throwing",
  });
}
if (!ownerEntry.includes("event?.type")) {
  violations.push({
    rel: "pages/page-kind.js",
    line: 1,
    hint: "runPageKindAutomation(event) must fail closed for unknown or null events",
  });
}
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push({
    rel: "pages/page-kind.js",
    line: 1,
    hint: "runPageKindAutomation(event) must not reintroduce an event.type if-chain",
  });
}
if (ownerEntry.includes("detectPageKind(")) {
  violations.push({
    rel: "pages/page-kind.js",
    line: 1,
    hint: "runPageKindAutomation(event) must dispatch through pageKindEventHandlers",
  });
}
const ownerTest = readFileSync(`${SRC_DIR}/pages/page-kind.test.js`, "utf8");
if (
  !ownerTest.includes("rejects unknown and null page kind events without detecting a page") ||
  !ownerTest.includes("runPageKindAutomation(null)")
) {
  violations.push({
    rel: "pages/page-kind.test.js",
    line: 1,
    hint: "must cover unknown and null page-kind events",
  });
}

if (violations.length > 0) {
  console.error(
    `[verify-no-adhoc-pagekind] FAIL: ${violations.length} 处 ad-hoc 页面类型检测（应走 runPageKindAutomation(event)，pages/page-kind.js）：`
  );
  for (const v of violations) {
    console.error(`  src/${v.rel}:${v.line} ${v.hint}`);
  }
  process.exit(1);
}

console.log(
  "[verify-no-adhoc-pagekind] OK — 页面类型检测统一走 runPageKindAutomation(event)（无 ad-hoc host/三哨兵复合）"
);
