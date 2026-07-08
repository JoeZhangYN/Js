// 校验 src/**/*.js 每文件 SLOC（非注释非空行）≤ 150。
// 例外：文件前 5 行内有 `// file-size-gate: exempt <理由>` 注释，
// 或在 scripts/sloc-baseline.json 中登记已有格式化基线债务。
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const BASELINE_FILE = fileURLToPath(new URL("./sloc-baseline.json", import.meta.url));
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

function normalizePath(path) {
  return path.replace(/\\/g, "/");
}

function readBaseline() {
  if (!existsSync(BASELINE_FILE)) return {};
  const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));
  if (!baseline || typeof baseline !== "object" || Array.isArray(baseline)) {
    throw new Error("[verify-sloc] scripts/sloc-baseline.json must be an object");
  }
  return baseline;
}

function validateBaselineEntry(file, entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return `${file}: baseline entry must be an object`;
  }
  if (!Number.isInteger(entry.maxSloc) || entry.maxSloc <= LIMIT) {
    return `${file}: maxSloc must be an integer greater than ${LIMIT}`;
  }
  if (typeof entry.reason !== "string" || entry.reason.trim().length === 0) {
    return `${file}: reason is required`;
  }
  return null;
}

const baseline = readBaseline();
const violations = [];
const staleBaseline = [];
const invalidBaseline = [];
const seen = new Map();

for (const [file, entry] of Object.entries(baseline)) {
  const problem = validateBaselineEntry(file, entry);
  if (problem) invalidBaseline.push(problem);
}

for (const file of walk(SRC_DIR)) {
  const src = readFileSync(file, "utf8");
  const rel = normalizePath(relative(SRC_DIR, file));
  if (isExempt(src)) continue;
  const n = sloc(src);
  const baselineEntry = baseline[rel];
  if (baselineEntry) {
    seen.set(rel, n);
    if (n <= LIMIT) {
      staleBaseline.push(`${rel}: now ${n} SLOC; remove stale baseline`);
    } else if (n > baselineEntry.maxSloc) {
      violations.push({ file: rel, sloc: n, maxSloc: baselineEntry.maxSloc });
    }
    continue;
  }
  if (n > LIMIT) {
    violations.push({ file: rel, sloc: n });
  }
}

for (const file of Object.keys(baseline)) {
  if (!seen.has(file)) staleBaseline.push(`${file}: file missing or explicitly exempt`);
}

if (invalidBaseline.length > 0 || staleBaseline.length > 0 || violations.length > 0) {
  if (invalidBaseline.length > 0) {
    console.error("[verify-sloc] invalid baseline entries:");
    for (const problem of invalidBaseline) console.error(`  ${problem}`);
  }
  if (staleBaseline.length > 0) {
    console.error("[verify-sloc] stale baseline entries:");
    for (const problem of staleBaseline) console.error(`  ${problem}`);
  }
  if (violations.length > 0) {
    console.error(`[verify-sloc] ${violations.length} file(s) exceed ${LIMIT} SLOC:`);
    for (const v of violations) {
      const suffix = v.maxSloc ? ` (baseline max ${v.maxSloc})` : "";
      console.error(`  ${v.file}: ${v.sloc} SLOC${suffix}`);
    }
  }
  process.exit(1);
}
console.log(`[verify-sloc] OK - all files <= ${LIMIT} SLOC, exempt, or within baseline`);
