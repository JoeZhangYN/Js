// 反退化 probe（拆桥）：维修 / 买料的 HV 端点字面量只许出现在维修能力的两个端口文件——
// repair/repair-backend.js（两世界维修端点）+ repair/material-shop.js（物品商店买料端点）。
//
// 背景：维修曾是「带坏装备继续打 → 坏得更多 → 再修又失败」破坏性死循环重灾区（旧 arena/repair-check.js）。
// 现收敛为单一维修业务能力（parse/decide/backend/shop/orchestrator）+ 两世界后端端口。本 probe 锁「不再
// 散落平行维修路径」：任何文件直接拼这些端点 = 绕过端口抽象 = 业务孤岛回潮（铁律 1b 造抽象就要拆桥 / 铁律 4 反退化）。
//
// 设计：剥注释（复用 stripComments）后扫端点字面量；豁免两端口文件 + 第三方嵌入 hv-utils.js + 测试断言。命中逐条报行号 + exit 1。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
// 允许直接拼端点的文件（维修能力的端口实现所在）。
const ALLOWED = ["repair/repair-backend.js", "repair/material-shop.js"];
// 完全跳过：第三方原样嵌入 + 测试断言（合法引用端点 body，非运行时平行路径）。
const SKIP_EXACT = ["i18n/hv-utils.js"];
const isSkipped = (rel) =>
  SKIP_EXACT.includes(rel) || rel.endsWith(".test.js") || ALLOWED.includes(rel);

// 维修 / 买料端点的操作性字面量（唯一标识平行维修/买料代码路径）。
const PATTERNS = [
  { name: "?s=Forge&ss=re", re: /\?s=Forge&ss=re/ },
  { name: "?s=Bazaar&ss=am&screen=repair", re: /\?s=Bazaar&ss=am&screen=repair/ },
  { name: "select_mode=shop_pane", re: /select_mode=shop_pane/ },
  { name: "eqids[]", re: /eqids\[\]/ },
  { name: "repair_all", re: /repair_all/ },
];

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
  if (isSkipped(rel)) continue;
  const codeLines = stripComments(readFileSync(abs, "utf8")).split(/\r?\n/);
  for (let i = 0; i < codeLines.length; i += 1) {
    for (const { name, re } of PATTERNS) {
      if (re.test(codeLines[i])) {
        violations.push({ rel, line: i + 1, name });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[verify-no-parallel-repair] FAIL: ${violations.length} 处维修/买料端点散落在端口外（应走 repair/repair-backend.js 或 repair/material-shop.js）：`
  );
  for (const v of violations) {
    console.error(`  src/${v.rel}:${v.line} 出现 "${v.name}"`);
  }
  process.exit(1);
}

console.log("[verify-no-parallel-repair] OK — 维修/买料端点收敛在端口（无平行维修路径）");
