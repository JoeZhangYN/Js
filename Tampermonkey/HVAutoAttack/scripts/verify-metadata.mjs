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

const ALL_GRANTS = ["GM_setValue", "GM_getValue", "GM_deleteValue", "GM_notification", "unsafeWindow"];

const usedInCode = new Set();
for (const file of walk(SRC_DIR)) {
  const src = readFileSync(file, "utf8");
  for (const g of ALL_GRANTS) {
    if (new RegExp(`\\b${g}\\b`).test(src)) usedInCode.add(g);
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
