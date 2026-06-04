// i18n probe 共用词法预处理工具（剥注释 + CJK 判定）。
//
// 应抽尽抽（铁律1e）：verify-no-dup-translation 与 verify-topmenu-keys 两个 probe 都需要
// 「扫 hv-utils.js 源码时先剥注释、再判 CJK」这同一词法概念 —— 字面同名 ≥2 文件 → 收口此处单源，
// 避免 stripComments 状态机在两份拷贝间漂移（修一处漏另一处）。两 probe import 复用。

// CJK 判定：覆盖 扩展A(3400-4DBF) + 基本汉字(4E00-9FFF) + 兼容(F900-FAFF) + 扩展B+(20000-2FA1F)。
// 用码点区间而非字面 CJK 正则，避免源码/命令行编码把字面 CJK 字符破坏掉。
export function hasCJK(text) {
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
export function stripComments(src) {
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
