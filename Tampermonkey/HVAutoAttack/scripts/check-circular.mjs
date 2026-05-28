// 检测 src/**/*.js 的 ESM 循环依赖（Tarjan SCC）。
// 背景：riddle.js ↔ riddle-ml.js 循环依赖 + 顶层即时求值跨模块 const → TDZ
// "Cannot access 'X' before initialization"。本门控防此类退化。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

const FROM_RE = /from\s*["'](\.[^"']+)["']/g;
const SIDE_RE = /import\s*["'](\.[^"']+)["']/g;

function resolveDep(file, spec) {
  let dep = resolve(dirname(file), spec);
  if (!dep.endsWith(".js")) dep += ".js";
  return dep;
}

const graph = new Map();
for (const f of walk(SRC)) {
  const src = readFileSync(f, "utf8");
  const deps = new Set();
  for (const re of [FROM_RE, SIDE_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) deps.add(resolveDep(f, m[1]));
  }
  graph.set(f, [...deps]);
}

// Tarjan 强连通分量：size > 1 即为循环依赖。
let index = 0;
const stack = [];
const onStack = new Set();
const idx = new Map();
const low = new Map();
const sccs = [];
function strongconnect(v) {
  idx.set(v, index);
  low.set(v, index);
  index++;
  stack.push(v);
  onStack.add(v);
  for (const w of graph.get(v) || []) {
    if (!graph.has(w)) continue;
    if (!idx.has(w)) {
      strongconnect(w);
      low.set(v, Math.min(low.get(v), low.get(w)));
    } else if (onStack.has(w)) {
      low.set(v, Math.min(low.get(v), idx.get(w)));
    }
  }
  if (low.get(v) === idx.get(v)) {
    const comp = [];
    let w;
    do {
      w = stack.pop();
      onStack.delete(w);
      comp.push(w);
    } while (w !== v);
    if (comp.length > 1) sccs.push(comp);
  }
}
for (const v of graph.keys()) if (!idx.has(v)) strongconnect(v);

const rel = (p) => relative(SRC, p).replace(/\\/g, "/");
if (sccs.length === 0) {
  console.log("[check-circular] OK — 无循环依赖");
} else {
  console.error(`[check-circular] 发现 ${sccs.length} 个循环依赖强连通分量:`);
  for (const c of sccs) console.error("  环: " + c.map(rel).sort().join(" ↔ "));
  process.exit(1);
}
