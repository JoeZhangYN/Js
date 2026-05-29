// 校验 vite.config.js 的 grant 数组与 src 代码使用的 GM_* / unsafeWindow 一致。
// 用 + grant 未声明 → 阻塞。grant 声明 + 代码未用 → 警告。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const VITE_CONFIG = fileURLToPath(new URL("../vite.config.js", import.meta.url));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

// 动态提取代码实际使用的 grant 符号（GM_* 下划线 API + unsafeWindow），
// 不再维护独立硬编码白名单 —— 白名单与 vite grant 数组是双源，易漂移
// （历史 bug：ALL_GRANTS 漏 GM_xmlhttpRequest → 误报 "declared but unused"）。
// GM.xmlHttpRequest（点号变体）是运行时 fallback、非 grant 声明名，故只扫下划线形式。
const GRANT_RE = /\b(GM_\w+|unsafeWindow)\b/g;

// 免-grant 特例：GM_info（及 GM.info）在所有 GM 实现中无需 @grant 即可访问，
// 是 GM API 标准特例。reloader.js 用 `typeof GM_info !== "undefined"` 做存在性守卫，
// 不应据此要求 vite grant 声明 GM_info，否则误报 "grant missing"。
const NO_GRANT_NEEDED = new Set(["GM_info"]);

const usedInCode = new Set();
for (const file of walk(SRC_DIR)) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(GRANT_RE)) {
    if (!NO_GRANT_NEEDED.has(m[1])) usedInCode.add(m[1]);
  }
}

const viteSrc = readFileSync(VITE_CONFIG, "utf8");
const grantsBlockMatch = viteSrc.match(/grant:\s*\[([\s\S]*?)\]/);
if (!grantsBlockMatch) {
  console.error("[verify-metadata] FAIL: cannot locate `grant: [...]` in vite.config.js");
  process.exit(1);
}
const declaredGrants = new Set(
  [...grantsBlockMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
);

const missingGrant = [...usedInCode].filter((g) => !declaredGrants.has(g));
const unusedGrant = [...declaredGrants].filter((g) => !usedInCode.has(g));

if (missingGrant.length > 0) {
  console.error(`[verify-metadata] FAIL: code uses but @grant missing: ${missingGrant.join(", ")}`);
  process.exit(1);
}
if (unusedGrant.length > 0) {
  console.warn(`[verify-metadata] WARN: @grant declared but code unused: ${unusedGrant.join(", ")}`);
}
console.log(`[verify-metadata] OK — code uses: ${[...usedInCode].join(", ") || "(none)"}`);
