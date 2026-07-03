// 反退化 probe：守住 src/i18n/hv-utils.js 的 topMenuLinks「逻辑键必须英文」不变量。
//
// 背景（已修回归 f62738c）：topMenuLinks 存的是 **逻辑键**（运行时索引 _top.menu[b]，
// 显示文案来自 m.label / m.text / m.button 中文）。f62738c 误把默认键从
//   ['Character','Equipment',...] 翻成 ['角色','装备',...]，破坏 _top.menu 匹配：
//   主世界 render filter 静默丢弃中文键链接（Equipment/MoogleMail 消失）；
//   ISEKAI render fall-through 渲染 undefined；render `links.push('莫古利邮局')` 在有新邮件时崩。
// 根因 = 违反铁律1「逻辑键必须基于英文，仅翻显示」。
//
// 本 probe 锁死「键被再翻译」这一确切退化形态：扫两处 `topMenuLinks: [ … ]` 默认值数组字面量
// 与 `links.push('…')` 实参，断言其中 **不得含 CJK**（键含 CJK = 被翻译 = 违规）。
//
// 设计取舍：
//   - 只查 CJK 出现，不做 key∈_top.menu 成员校验 —— 后者需解析 ~25 项多行对象字面量、脆；
//     CJK 检测无需 JS AST、鲁棒，且精准命中真实回归形态（翻译）。英文键拼写错另由运行时
//     validator.topMenuLinks（hv-utils:918 _top.menu.hasOwnProperty）兜底校验用户输入。
//   - 注释先剥离（复用共用词法库）→ 键旁「逻辑键必须英文」等 CJK 旁注不误报。
//   - `topMenuLinks:\s*\[` 精确命中默认数组，不碰 desc 模板串(`: \`List`)/validator(`: function`)/
//     config 条目(`key:'topMenuLinks'`)/成员访问(`.topMenuLinks`)。
//
// 输出对齐同目录 probe：
//   绿：[verify-topmenu-keys] OK — ...   exit 0
//   命中：逐条 `hv-utils.js:行号 …` 后 exit 1。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { hasCJK, stripComments } from "./lib/i18n-probe-lex.mjs";

const TARGET = fileURLToPath(new URL("../src/i18n/hv-utils.js", import.meta.url));

let src;
try {
  src = readFileSync(TARGET, "utf8");
} catch {
  console.error(`[verify-topmenu-keys] FAIL: ${TARGET} not found`);
  process.exit(1);
}

// 剥注释后按行扫（字符串内容原样保留 → 数组字面量完整；CJK 旁注被剥为空格不误报）。
const codeLines = stripComments(src).split(/\r?\n/);

const violations = [];
if (!src.includes("var record_hvut_top_level_parse_failure = function (stage, detail) {")) {
  violations.push({ line: 1, what: "缺少 HVUT 顶部等级解析失败证据入口" });
}
if (!src.includes("sessionStorage.setItem('HVAA:lastHvutTopLevelParseFailure', JSON.stringify(evidence));")) {
  violations.push({ line: 1, what: "顶部等级解析失败证据未持久化" });
}
if (!src.includes("var parse_hvut_top_level_progress = function (text, stage) {")) {
  violations.push({ line: 1, what: "缺少顶部等级进度解析入口" });
}
if (!src.includes("const progress = parse_hvut_top_level_progress($id('level_details')?.textContent, 'topLevelDetails');")) {
  violations.push({ line: 1, what: "level_details 未走顶部等级进度解析入口" });
}
if (!src.includes("if (progress !== null) {")) {
  violations.push({ line: 1, what: "顶部等级进度解析失败时必须跳过子菜单渲染" });
}
if (/level_details'\)\.textContent\);\n\s*const exp = parseInt\(exec\[1\]/.test(src)) {
  violations.push({ line: 1, what: "顶部等级进度不得保留裸 exec[1] 解析路径" });
}
// 单一来源清单：TOP_MENU_DEFAULT_LINKS = [ … ] 单行字面量（topMenuLinks 用户设置 2026-06-10 退化, 清单收敛 L1 常量）。
const ARR_RE = /TOP_MENU_DEFAULT_LINKS\s*=\s*\[([^\]]*)\]/;
// 渲染兜底 push：links.push('…') 字符串实参（topMenu 渲染唯一的 links 变量，全文件仅两处）。
const PUSH_RE = /\blinks\.push\(\s*(['"])([^'"]*)\1\s*\)/g;

for (let i = 0; i < codeLines.length; i += 1) {
  const line = codeLines[i];

  const arr = ARR_RE.exec(line);
  if (arr && hasCJK(arr[1])) {
    violations.push({
      line: i + 1,
      what: "TOP_MENU_DEFAULT_LINKS 清单含 CJK 键",
    });
  }

  PUSH_RE.lastIndex = 0;
  let m;
  while ((m = PUSH_RE.exec(line)) !== null) {
    if (hasCJK(m[2])) {
      violations.push({
        line: i + 1,
        what: `links.push('${m[2]}') 实参含 CJK 键`,
      });
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[verify-topmenu-keys] FAIL: 顶部快速链接清单出现 ${violations.length} 处「逻辑键被翻译成中文」（铁律1：逻辑键须英文，索引 _top.menu）：`
  );
  for (const v of violations) {
    console.error(`  hv-utils.js:${v.line} ${v.what}`);
  }
  console.error(
    `  修复：把键还原为英文（_top.menu 的 key，如 'Equipment'/'MoogleMail'）；显示中文由 m.label/m.text/m.button 负责，勿翻键。`
  );
  process.exit(1);
}

console.log(
  "[verify-topmenu-keys] OK — TOP_MENU_DEFAULT_LINKS 逻辑键均为英文（显示走 m.label/m.text/m.button）"
);
