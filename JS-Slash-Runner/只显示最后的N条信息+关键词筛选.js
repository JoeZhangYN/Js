// ============ 只显示最后的N条信息+关键词筛选 ============
// 初始化脚本变量默认值
insertVariables(
  { joezhangynShowLastMessage: 10, joezhangynFilterKeywords: "", joezhangynHighlightDelay: 0.5 },
  { type: "script" },
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

$("<style>").text(
  ".keyword-hl { background: #FFD700; color: #000; font-weight: bold; padding: 1px 4px; border-radius: 3px; }",
).appendTo("head");

async function onlyShowLast() {
  eventClearListener(onlyShowLast);

  const lastId = getLastMessageId();
  const variables = getVariables({ type: "script" });
  const showLastMessage = variables.joezhangynShowLastMessage ?? 10;
  const filterKeywords = variables.joezhangynFilterKeywords || "";

  const startIndex =
    showLastMessage === 0 || showLastMessage > lastId
      ? 0
      : lastId - showLastMessage + 1;
  const endIndex = lastId + 1;

  $("#chat").children().remove();

  let messagesToRender = [];
  // 预编译筛选表达式 + 高亮正则：长聊天里避免每条消息重建
  const matcher = filterKeywords ? compilePattern(filterKeywords) : null;
  const highlightRegex = filterKeywords ? buildHighlightRegex(filterKeywords) : null;

  if (matcher) {
    for (let i = 0; i < SillyTavern.chat.length; i++) {
      const message = SillyTavern.chat[i];
      if (!message || !message.mes) continue;

      if (matcher(message.mes)) {
        messagesToRender.push({ index: i, message, matched: true });
      }
    }
  } else {
    for (let i = startIndex; i < endIndex; i++) {
      messagesToRender.push({ index: i, message: SillyTavern.chat[i] });
    }
  }

  for (const item of messagesToRender) {
    builtin.addOneMessage(item.message, { forceId: item.index });
    eventEmit(
      item.message.is_user
        ? tavern_events.USER_MESSAGE_RENDERED
        : tavern_events.CHARACTER_MESSAGE_RENDERED,
      item.index,
    );
  }

  if (highlightRegex) {
    const highlightDelay = variables.joezhangynHighlightDelay ?? 0.5;
    await delay(highlightDelay * 1000);
    for (const item of messagesToRender) {
      if (item.matched) {
        highlightKeywordsInMessage(item.index, highlightRegex);
      }
    }
  }

  restoreListen();
}

function extractAllKeywords(pattern) {
  return pattern
    .replace(/\(/g, " ")
    .replace(/\)/g, " ")
    .split(/[&|]/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

function buildHighlightRegex(pattern) {
  const keywords = extractAllKeywords(pattern);
  if (!keywords.length) return null;
  keywords.sort((a, b) => b.length - a.length);
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(<[^>]+>)|(${escaped.join("|")})`, "gi");
}

function highlightKeywordsInMessage(messageId, regex) {
  const $mes = retrieveDisplayedMessage(messageId);
  if (!$mes.length) return;
  $mes.html(
    $mes.html().replace(regex, (match, tag, kw) =>
      tag ? tag : `<span class="keyword-hl">${kw}</span>`,
    ),
  );
}

// 把表达式解析为 AST 一次，返回闭包；后续对每条消息只跑 evaluate
function compilePattern(pattern) {
  function isBalancedParens(str) {
    let count = 0;
    for (const ch of str) {
      if (ch === "(") count++;
      else if (ch === ")") count--;
      if (count < 0) return false;
    }
    return count === 0;
  }

  function tokenize(expr) {
    const tokens = [];
    let current = "";
    let parenCount = 0;
    for (const ch of expr) {
      if (ch === "(") { parenCount++; current += ch; }
      else if (ch === ")") { parenCount--; current += ch; }
      else if (parenCount === 0 && (ch === "&" || ch === "|")) {
        if (current.trim()) tokens.push(current.trim());
        tokens.push(ch);
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) tokens.push(current.trim());
    return tokens;
  }

  function parseExpr(expr) {
    expr = expr.trim();
    while (
      expr.startsWith("(") &&
      expr.endsWith(")") &&
      isBalancedParens(expr.slice(1, -1))
    ) {
      expr = expr.slice(1, -1).trim();
    }
    return parseTokens(tokenize(expr));
  }

  function parseTokens(tokens) {
    if (tokens.length === 1) {
      const token = tokens[0];
      if (token.startsWith("(") && token.endsWith(")")) return parseExpr(token);
      return {
        type: "leaf",
        regex: new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      };
    }
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === "&") {
        return {
          type: "and",
          left: parseTokens(tokens.slice(0, i)),
          right: parseTokens(tokens.slice(i + 1)),
        };
      }
    }
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === "|") {
        return {
          type: "or",
          left: parseTokens(tokens.slice(0, i)),
          right: parseTokens(tokens.slice(i + 1)),
        };
      }
    }
    return { type: "leaf", regex: /(?!)/ };
  }

  function evaluate(node, text) {
    if (node.type === "leaf") return node.regex.test(text);
    if (node.type === "and") return evaluate(node.left, text) && evaluate(node.right, text);
    if (node.type === "or") return evaluate(node.left, text) || evaluate(node.right, text);
    return false;
  }

  let ast;
  try {
    ast = parseExpr(pattern);
  } catch (e) {
    console.error("[筛选] 解析表达式失败，回退到全文匹配:", e);
    const fallback = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return (text) => fallback.test(text);
  }
  return (text) => evaluate(ast, text);
}

// --- 按钮事件（弃用 eventOnButton → eventOn + getButtonEvent）---

eventOn(getButtonEvent("设置筛选关键词"), async () => {
  const current =
    getVariables({ type: "script" }).joezhangynFilterKeywords || "";

  const input = await SillyTavern.callGenericPopup(
    `请输入筛选关键词:
    - 使用 | 表示"或" (例如: A|B)
    - 使用 & 表示"并且" (例如: A&B)
    - 使用括号分组 (例如: (A|B)&(C|D))

    当前关键词: ${current}`,
    SillyTavern.POPUP_TYPE.INPUT,
    current,
  );

  if (input === false) return;

  insertOrAssignVariables(
    { joezhangynFilterKeywords: input },
    { type: "script" },
  );
  await onlyShowLast();
  toastr.success(
    input === "" ? "已清除筛选关键词" : `已设置筛选关键词: ${input}`,
  );
});

eventOn(getButtonEvent("修改显示条数"), async () => {
  const current =
    getVariables({ type: "script" }).joezhangynShowLastMessage ?? 10;
  const isShowAll = current === 0;

  const input = await SillyTavern.callGenericPopup(
    `请输入显示聊天条数(格式: 10)\n\n当前显示条数: ${isShowAll ? "全部" : current}`,
    SillyTavern.POPUP_TYPE.INPUT,
    isShowAll ? "0" : String(current),
  );

  if (input === false) return;
  const num = Number(input);
  if (!Number.isInteger(num) || num <= 0)
    return void toastr.error("输入的非有效整数");

  insertOrAssignVariables(
    { joezhangynShowLastMessage: num, joezhangynFilterKeywords: "" },
    { type: "script" },
  );
  await onlyShowLast();
  toastr.success(`已修改显示条数为: ${num}`);
});

eventOn(getButtonEvent("显示全部条数"), () => {
  eventClearListener(onlyShowLast);
  insertOrAssignVariables({ joezhangynShowLastMessage: 0, joezhangynFilterKeywords: "" }, { type: "script" });
  builtin.reloadAndRenderChatWithoutEvents();
  toastr.success("已切换为显示全部消息");
});

function restoreListen() {
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, onlyShowLast);
  eventOn(tavern_events.CHAT_CHANGED, onlyShowLast);
}

restoreListen();