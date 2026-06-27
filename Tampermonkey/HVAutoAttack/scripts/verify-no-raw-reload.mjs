// 反退化 probe（拆桥）：禁止 src 内裸用 `setTimeout(goto, …)`，统一走 core/navigate.js 的导航事件入口。
//
// 背景：`setTimeout(goto, N*1000)` 延时重载惯用式曾散落 4 处（main-loop/reloader×2/init），已收口到
// runNavigationAutomation({ type: NavigationEvent.SCHEDULE_RELOAD, sec })。本 probe 锁「不再散落」：
// 裸 setTimeout(goto) 只许出现在 core/navigate.js（goto 自重试 primitive + scheduleReload 实现）。
//
// 设计：剥注释（复用共用词法库 stripComments）后扫 `setTimeout(<空白>goto<词界>`；豁免 core/navigate.js。
// 命中逐条报行号 + exit 1。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs"; // stripComments 为通用 JS 注释剥离，非 i18n 专属

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const EXEMPT = ["core/navigate.js"]; // goto primitive + scheduleReload 实现所在
const RE = /setTimeout\(\s*goto\b/;

/** 递归收集 src 下所有 .js（返回相对 src 的 posix 路径）。 */
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
    if (RE.test(codeLines[i])) {
      violations.push({ rel, line: i + 1 });
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[verify-no-raw-reload] FAIL: ${violations.length} 处裸用 setTimeout(goto)（应走导航事件入口，core/navigate.js）：`
  );
  for (const v of violations) {
    console.error(
      `  src/${v.rel}:${v.line} setTimeout(goto, …) → runNavigationAutomation(SCHEDULE_RELOAD)`
    );
  }
  process.exit(1);
}

console.log("[verify-no-raw-reload] OK — 延时重载统一走导航事件入口（无裸 setTimeout(goto)）");
