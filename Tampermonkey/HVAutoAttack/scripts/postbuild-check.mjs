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

// 6. @grant 必须列全 5 项
for (const g of ["GM_setValue", "GM_getValue", "GM_deleteValue", "GM_notification", "unsafeWindow"]) {
  if (!new RegExp(`@grant\\s+${g}\\b`).test(src)) errors.push(`@grant missing ${g}`);
}

if (errors.length > 0) {
  console.error("[postbuild-check] FAIL:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`[postbuild-check] OK — ${(size / 1024).toFixed(1)} KB`);
