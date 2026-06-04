// 反退化 probe：禁止 src/i18n/hv-utils.js 再现「独立翻译表字面量」。
//
// i18n SSOT 归一 epic 已把散落的私有翻译表（HVAA_ITEM_CN / HVUT_CN.material/spell/
// eqCategory/abCategory 等）收口到 canonical SSOT（src/data/i18n/*.js），调用点统一改
// 走全局桥 window.HVAA_i18n.t()（hv-utils 内桥名 hvaaT / hvaaTEquip / resolveEn）。
// 本 probe 守住「不再现」：扫 hv-utils.js，找形如
//   const/let/var NAME = { 'English Term': '中文译名', ... }
// 的「英文 key → 含 CJK 中文 value」对象字面量；同一对象内 ≥3 条这样的条目 → 判为
// 翻译表 → 违规（应删，改走 hvaaT / hvaaTEquip / canonical dict）。
//
// 设计取舍（精度优先，宁漏勿滥）：
//   - 阈值 ≥3：单条/两条中文常量（alert 文案、按钮 label 等）不算翻译表，不报（防假阳）。
//   - 仅扫 src/i18n/hv-utils.js。canonical SSOT（src/data/i18n/*.js）是合法翻译表，不扫。
//   - 注释（// 与 /* */）内的内容不算（先做状态机注释剥离，再扫）。
//   - 内联 switch 习语 `{ 'a':'甲', ... }[expr]`（对象字面量当场被下标取值、不存名）不算
//     「翻译表」—— 它是一次性 UI label 取值开关，非散落复用的 SSOT 漂移表。判定特征：
//     单行块且该行对象 `}` 紧跟 `[`（立即下标）。真翻译表是 `const NAME = {…}` / `key: {…}`
//     命名绑定、整存整取（与 spec 范例 const NAME = {…} 一致）。漏报此习语契合「精度优先」。
//   - 豁免标记 `i18n-probe-allow`：紧贴违规块上方的注释里出现该标记 → 该块豁免
//     （现存唯一合法例：HVUT_CN.stamina 整句 tooltip 替换，游戏原生整句、非术语表）。
//
// 输出对齐同目录现有 probe（verify-sloc/verify-metadata/postbuild-check）：
//   绿：[verify-no-dup-translation] OK — ...   exit 0
//   命中：逐条 `hv-utils.js:行号 标签（N 条英→中映射，应走桥）` 后 exit 1。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TARGET = fileURLToPath(new URL("../src/i18n/hv-utils.js", import.meta.url));
const MIN_ENTRIES = 3; // 同一对象内英→中条目数达此值才判为翻译表（防假阳）
const ALLOW_MARKER = "i18n-probe-allow";

// CJK 判定：覆盖 扩展A(3400-4DBF) + 基本汉字(4E00-9FFF) + 兼容(F900-FAFF) + 扩展B+(20000-2FA1F)。
// 用码点区间而非字面 CJK 正则，避免源码/命令行编码把字面 CJK 字符破坏掉。
function hasCJK(text) {
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (
      (c >= 0x3400 && c <= 0x9fff) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0x20000 && c <= 0x2fa1f)
    ) {
      return true;
    }
  }
  return false;
}

// 状态机剥注释：把 // 与 /* */ 内容替换为空格（保留换行 → 行号/列号不变）。
// 跟踪 '...' / "..." / `...` 字符串，避免把字符串里的 // 当注释（如 'http://'）。
// 模板串里的 ${...} 不做嵌套解析（hv-utils 模板内无注释，过度解析反引入风险）。
function stripComments(src) {
  const out = src.split("");
  let i = 0;
  const n = src.length;
  let mode = "code"; // code | line | block | sq | dq | tpl
  // lastSig = 上一个有意义代码字符（跳过空白），用于消歧 `/`：正则 vs 除号。
  // 若 lastSig 是「不能作为表达式结尾」的字符（运算符 / 分隔符 / 关键字尾），则 `/` 起正则。
  let lastSig = "";
  const REGEX_PREV = new Set([
    "", "(", ",", "=", ":", "[", "{", "}", ";", "!", "&", "|", "?",
    "+", "-", "*", "/", "%", "<", ">", "^", "~", "\n",
  ]);
  while (i < n) {
    const c = src[i];
    const c2 = i + 1 < n ? src[i + 1] : "";
    if (mode === "code") {
      if (c === "/" && c2 === "/") {
        mode = "line";
        out[i] = " ";
        out[i + 1] = " ";
        i += 2;
        continue;
      }
      if (c === "/" && c2 === "*") {
        mode = "block";
        out[i] = " ";
        out[i + 1] = " ";
        i += 2;
        continue;
      }
      // 正则字面量：`/` 跟在「表达式不能结尾处」之后 → 跳到闭合 `/`（尊重 \ 转义与
      // [...] 字符类内的字面 `/`）。不跳过正则会把 /Today's .../ 里的 ' 误判为字符串起点，
      // 使状态机卡死在 sq/dq、后续注释剥离全部失效（真 bug：line 3709 触发）。
      if (c === "/" && REGEX_PREV.has(lastSig)) {
        i += 1; // 越过开头的 /
        let inClass = false;
        while (i < n) {
          const r = src[i];
          if (r === "\\") {
            i += 2;
            continue;
          }
          if (r === "[") inClass = true;
          else if (r === "]") inClass = false;
          else if (r === "/" && !inClass) {
            i += 1;
            break;
          } else if (r === "\n") {
            break; // 正则不跨行；防御性兜底
          }
          i += 1;
        }
        lastSig = "/";
        continue;
      }
      if (c === "'") {
        mode = "sq";
        i += 1;
        continue;
      }
      if (c === '"') {
        mode = "dq";
        i += 1;
        continue;
      }
      if (c === "`") {
        mode = "tpl";
        i += 1;
        continue;
      }
      if (!/\s/.test(c)) lastSig = c;
      i += 1;
      continue;
    }
    if (mode === "line") {
      if (c === "\n") {
        mode = "code";
        i += 1;
      } else {
        out[i] = " ";
        i += 1;
      }
      continue;
    }
    if (mode === "block") {
      if (c === "*" && c2 === "/") {
        out[i] = " ";
        out[i + 1] = " ";
        mode = "code";
        i += 2;
      } else {
        if (c !== "\n") out[i] = " ";
        i += 1;
      }
      continue;
    }
    // 字符串内：仅处理转义与闭合引号，内容原样保留
    if (mode === "sq" || mode === "dq" || mode === "tpl") {
      if (c === "\\") {
        i += 2; // 跳过转义字符
        continue;
      }
      if (
        (mode === "sq" && c === "'") ||
        (mode === "dq" && c === '"') ||
        (mode === "tpl" && c === "`")
      ) {
        mode = "code";
        lastSig = c; // 字符串结尾是「表达式结尾」→ 其后的 `/` 是除号非正则
      }
      i += 1;
      continue;
    }
  }
  return out.join("");
}

// 单行内匹配所有「'asciiKey' : '...' 」条目（key/value 引号可单/双，value 允许转义）。
// key 限 ASCII 可见字符（含空格 → 支持整句英文 key）；value 经 hasCJK 判定含中文。
function countCjkEntriesInLine(line) {
  const re =
    /(["'])((?:\\.|(?!\1)[\x20-\x7e])+?)\1\s*:\s*(["'])((?:\\.|(?!\3)[^])*?)\3/g;
  let m;
  let count = 0;
  while ((m = re.exec(line)) !== null) {
    const key = m[2];
    const value = m[4];
    if (key.trim().length > 0 && hasCJK(value)) count += 1;
  }
  return count;
}

// 从块起始行向上走，跳过 注释行 / 空行 / 结构开括行（const X = { · key: { · 单独 {），
// 若途中遇到含 ALLOW_MARKER 的注释行 → 该块豁免。遇到第一行「真正代码且非开括」即停。
function isAllowed(rawLines, blockStartLineIdx) {
  for (let i = blockStartLineIdx - 1; i >= 0; i -= 1) {
    const t = rawLines[i].trim();
    if (t.length === 0) continue;
    const isComment =
      t.startsWith("//") || t.startsWith("/*") || t.startsWith("*");
    if (isComment) {
      if (rawLines[i].includes(ALLOW_MARKER)) return true;
      continue;
    }
    // 结构开括行：声明 / 子dict key opener / 单独左花括号 → 继续向上找标记
    const isOpener =
      /^(?:const|let|var)\b[^=]*=\s*\{?\s*$/.test(t) ||
      /^['"]?[\w$-]+['"]?\s*:\s*\{?\s*$/.test(t) ||
      t === "{" ||
      t === "({" ||
      t.endsWith("= {") ||
      t.endsWith(": {");
    if (isOpener) continue;
    return false; // 撞到实质代码 → 上方无适用标记
  }
  return false;
}

// 内联 switch 习语判定：单行块，且该行存在「对象字面量 `}` 紧跟 `[`」（立即下标取值）。
// 对剥注释后的代码行扫 `}\s*\[` 即可（字符串里的 `}[` 极罕见且不构成英→中表，可忽略）。
function isInlineSwitch(codeLine, blockStartIdx, blockEndIdx) {
  if (blockStartIdx !== blockEndIdx) return false; // 多行命名表不是内联 switch
  return /\}\s*\[/.test(codeLine);
}

// 为违规块取一个可读标签：向上找最近的 `const/let/var NAME =` 或 `NAME:` 子dict 名。
function blockLabel(rawLines, blockStartLineIdx) {
  for (let i = blockStartLineIdx - 1; i >= 0; i -= 1) {
    const t = rawLines[i].trim();
    if (t.length === 0) continue;
    let m = t.match(/^(?:const|let|var)\s+([\w$]+)\s*=/);
    if (m) return m[1];
    m = t.match(/^['"]?([\w$-]+)['"]?\s*:\s*\{?\s*$/);
    if (m) return m[1];
    if (t.startsWith("//") || t.startsWith("/*") || t.startsWith("*")) continue;
    if (t === "{" || t.endsWith("= {") || t.endsWith(": {")) continue;
    break;
  }
  return "(匿名对象)";
}

let src;
try {
  src = readFileSync(TARGET, "utf8");
} catch {
  console.error(`[verify-no-dup-translation] FAIL: ${TARGET} not found`);
  process.exit(1);
}

const rawLines = src.split(/\r?\n/);
const codeLines = stripComments(src).split(/\r?\n/);

// 把「连续含 ≥1 条英→中条目」的行聚成块（中间出现非条目行即断块）。
// hv-utils 的术语表（HVUT_CN.spell/eqCategory/...）与内联 {inbox:..} 均落在连续行内，
// 故按行聚块即可识别每个独立对象字面量（含嵌套子dict —— 子dict 的条目自成连续段）。
const blocks = [];
let curCount = 0;
let curStartIdx = -1;
let curEndIdx = -1;
for (let i = 0; i < codeLines.length; i += 1) {
  const n = countCjkEntriesInLine(codeLines[i]);
  if (n > 0) {
    if (curCount === 0) curStartIdx = i;
    curEndIdx = i;
    curCount += n;
  } else if (curCount > 0) {
    blocks.push({ startIdx: curStartIdx, endIdx: curEndIdx, count: curCount });
    curCount = 0;
    curStartIdx = -1;
    curEndIdx = -1;
  }
}
if (curCount > 0)
  blocks.push({ startIdx: curStartIdx, endIdx: curEndIdx, count: curCount });

const violations = [];
for (const b of blocks) {
  if (b.count < MIN_ENTRIES) continue;
  if (isInlineSwitch(codeLines[b.startIdx], b.startIdx, b.endIdx)) continue;
  if (isAllowed(rawLines, b.startIdx)) continue;
  violations.push({
    line: b.startIdx + 1, // 1-based 行号
    label: blockLabel(rawLines, b.startIdx),
    count: b.count,
  });
}

if (violations.length > 0) {
  console.error(
    `[verify-no-dup-translation] FAIL: hv-utils 出现 ${violations.length} 处独立翻译表（应走 canonical SSOT 桥 hvaaT/hvaaTEquip）：`
  );
  for (const v of violations) {
    console.error(
      `  hv-utils.js:${v.line} ${v.label}（${v.count} 条英→中映射，应走桥）`
    );
  }
  console.error(
    `  修复：删除该字面量，调用点改 hvaaT(value, group) / hvaaTEquip(name)，或把数据并入 src/data/i18n/*.js canonical dict。`
  );
  console.error(`  确属整句/非术语表的合法例外：在块上方注释加 // ${ALLOW_MARKER}: <理由>。`);
  process.exit(1);
}

console.log(
  "[verify-no-dup-translation] OK — hv-utils 无独立翻译表（翻译走 canonical SSOT 桥）"
);
