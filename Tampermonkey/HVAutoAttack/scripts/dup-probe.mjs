// 应抽尽抽·机械召回探针（侦察工具，手动跑，不入 build 链 —— 现存留置候选会命中，那是审查后
// 的合法留置不是违规；回潮防护走 verify-no-iife-dup.mjs）。
// 扫 hv-utils.js 两 IIFE 同名函数/方法，规范化后对比相似度，输出 IDENT / SIM>=0.75 候选清单，
// 供对应轴人工审查（真重复收口 / 机制分叉留置；红线与先例见 hv-utils.js 头「设计要点 4」及 bindTr/bindRe 注释）。
// 用法：node scripts/dup-probe.mjs                  → 候选清单
//       node scripts/dup-probe.mjs diff '$persona'  → 该对象非 IDENT 方法的逐对 word-diff
//       node scripts/dup-probe.mjs diff '$dfct' change → 只看指定方法
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TARGET = fileURLToPath(new URL("../src/i18n/hv-utils.js", import.meta.url));
const lines = readFileSync(TARGET, "utf8").split("\n");

// 分区：L1 共享(1..isekaiStart-1) / isekai IIFE / 主世界 IIFE
const isekaiStart = lines.findIndex((l) => /^if \(IS_ISEKAI\) \{/.test(l)) + 1;
let mainStart = -1;
for (let i = isekaiStart; i < lines.length; i++) {
  if (/^\} else \{/.test(lines[i])) { mainStart = i + 1; break; }
}
console.log(`# isekai IIFE: L${isekaiStart + 1}.. , main IIFE: L${mainStart + 1}..`);

// 提取函数体：从定义行起花括号配对到 depth 归零
function extractBody(start) {
  let depth = 0, started = false, out = [];
  for (let i = start; i < lines.length && i < start + 400; i++) {
    const l = lines[i];
    out.push(l);
    for (const ch of l) {
      if (ch === "{") { depth++; started = true; }
      else if (ch === "}") depth--;
    }
    if (started && depth <= 0) return { body: out.join("\n"), end: i };
  }
  return { body: out.join("\n"), end: start };
}

const defRe = [
  /^\s{2}([\w$]+)\s*:\s*(?:async\s+)?function\s*\(/, // 对象方法（2 空格缩进 = 顶层对象成员）
  /^(?:const|var|let)\s+([\w$]+)\s*=\s*(?:async\s+)?function/,
  /^function\s+([\w$]+)\s*\(/,
];

function scan(from, to) {
  const defs = new Map();
  let owner = "";
  for (let i = from; i < to; i++) {
    const l = lines[i];
    const own = /^(?:const|var|let)\s+(\$?[\w$]+)\s*=\s*\{/.exec(l);
    if (own) owner = own[1];
    for (const re of defRe) {
      const m = re.exec(l);
      if (m) {
        const key = re === defRe[0] ? `${owner}.${m[1]}` : m[1];
        const { body } = extractBody(i);
        defs.set(key, { line: i + 1, body });
        break;
      }
    }
  }
  return defs;
}

const norm = (s) =>
  s
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();

// token 集相似度（Jaccard over word tokens）
function sim(a, b) {
  const ta = new Set(a.match(/[\w$]+/g) || []);
  const tb = new Set(b.match(/[\w$]+/g) || []);
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter || 1);
}

const ise = scan(isekaiStart, mainStart - 1);
const main = scan(mainStart, lines.length);

// 同短名匹配（owner 可能不同名，按方法短名 join）
const byShort = (defs) => {
  const m = new Map();
  for (const [k, v] of defs) {
    const short = k.includes(".") ? k.split(".")[1] : k;
    if (!m.has(short)) m.set(short, []);
    m.get(short).push({ key: k, ...v });
  }
  return m;
};
const iseShort = byShort(ise), mainShort = byShort(main);

const rows = [];
for (const [short, iList] of iseShort) {
  const mList = mainShort.get(short);
  if (!mList) continue;
  for (const a of iList)
    for (const b of mList) {
      const na = norm(a.body), nb = norm(b.body);
      const s = na === nb ? 1 : sim(na, nb);
      if (s >= 0.75)
        rows.push({
          short,
          ise: `${a.key}@L${a.line}`,
          main: `${b.key}@L${b.line}`,
          s: na === nb ? "IDENT" : s.toFixed(2),
          len: Math.max(na.length, nb.length),
        });
    }
}
// diff 模式：node tmp-dup-probe.mjs diff '$re' [method] → 输出该 owner 非 IDENT 方法对的行级对比
if (process.argv[2] === "diff") {
  const owner = process.argv[3];
  const only = process.argv[4];
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "dup-"));
  for (const [k, v] of ise) {
    if (!k.startsWith(owner + ".")) continue;
    const short = k.split(".")[1];
    if (only && short !== only) continue;
    const mv = main.get(k);
    if (!mv) { console.log(`## ${k}: main 无对应`); continue; }
    if (norm(v.body) === norm(mv.body)) continue;
    writeFileSync(join(dir, "a"), v.body + "\n");
    writeFileSync(join(dir, "b"), mv.body + "\n");
    console.log(`\n===== ${k} (ise L${v.line} vs main L${mv.line}) =====`);
    const { execSync } = await import("node:child_process");
    try {
      execSync(`git diff --no-index --word-diff=plain -- "${join(dir, "a")}" "${join(dir, "b")}"`, { stdio: "inherit" });
    } catch { /* git diff exits 1 on differences */ }
  }
} else {
  rows.sort((x, y) => (y.s === "IDENT" ? 2 : +y.s) - (x.s === "IDENT" ? 2 : +x.s));
  for (const r of rows)
    console.log(`${String(r.s).padEnd(5)} len=${String(r.len).padStart(5)} ${r.ise.padEnd(38)} <-> ${r.main}`);
  console.log(`# total candidates: ${rows.length}`);
}
