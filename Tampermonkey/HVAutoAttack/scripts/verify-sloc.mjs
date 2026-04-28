// 校验 src/**/*.js 每文件 SLOC（非注释非空行）≤ 150。
// 例外：文件前 5 行内有 `// file-size-gate: exempt <理由>` 注释。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const LIMIT = 150;

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

function sloc(src) {
  // 去 /* */ 块注释
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, "");
  return noBlock
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//")).length;
}

function isExempt(src) {
  const head = src.split(/\r?\n/).slice(0, 5).join("\n");
  return /\/\/\s*file-size-gate:\s*exempt/i.test(head);
}

const violations = [];
for (const file of walk(SRC_DIR)) {
  const src = readFileSync(file, "utf8");
  if (isExempt(src)) continue;
  const n = sloc(src);
  if (n > LIMIT) {
    violations.push({ file: relative(SRC_DIR, file), sloc: n });
  }
}

if (violations.length > 0) {
  console.error(`[verify-sloc] ${violations.length} file(s) exceed ${LIMIT} SLOC:`);
  for (const v of violations) console.error(`  ${v.file}: ${v.sloc} SLOC`);
  process.exit(1);
}
console.log(`[verify-sloc] OK — all files ≤ ${LIMIT} SLOC (or exempt)`);
