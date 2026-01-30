// ============ 角色卡对应世界书和聊天世界书自动捆绑解绑 ============
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const toSortedJson = (iterable) => JSON.stringify([...iterable].sort());

const SCRIPT_VAR = { type: "script" };

// 初始化脚本变量（已存在则不覆盖）
insertVariables(
  { joezhangynLastBindState: { Char_Worldbooks: [], Chat_Worldbook: null } },
  SCRIPT_VAR,
);

let lastChatChangeTimestamp = 0;

// 检查并删除空世界书（无条目，或所有条目内容均为空）
async function checkAndDeleteEmptyWorldbook(worldbookName) {
  if (!worldbookName) return;
  try {
    const entries = await getWorldbook(worldbookName);
    if (!entries) return;

    const isEmpty =
      entries.length === 0 ||
      entries.every((e) => !e.content?.trim());

    if (isEmpty) {
      await deleteWorldbook(worldbookName);
      console.log(`[自动清理] 删除空世界书: ${worldbookName}`);
    }
  } catch (err) {
    // 世界书不存在或读取失败，忽略
  }
}

// 标准化世界书名为 Set 集合
function normalizeWorldbookNames(bookData) {
  const set = new Set();
  if (!bookData) return set;

  if (typeof bookData === "string") {
    set.add(bookData);
  } else if (Array.isArray(bookData)) {
    bookData.forEach((book) => book && set.add(book));
  } else {
    if (bookData.primary) set.add(bookData.primary);
    if (Array.isArray(bookData.additional)) {
      bookData.additional.forEach((book) => book && set.add(book));
    }
  }
  return set;
}

// 批量清理所有空的 Chat_Book_* 世界书（跳过当前聊天的世界书）
async function cleanupEmptyChatWorldbooks() {
  try {
    const allBooks = getWorldbookNames();
    const currentChatBook = getChatWorldbookName("current");
    const chatBooks = allBooks.filter(
      (name) => name.startsWith("Chat_Book_") && name !== currentChatBook,
    );

    for (const bookName of chatBooks) {
      await checkAndDeleteEmptyWorldbook(bookName);
    }
  } catch (err) {
    console.error("[世界书管理] 批量清理聊天世界书失败:", err);
  }
}

// 更新全局世界书设置
async function updateGlobalWorldbookSettings(
  newSelections,
  variableData = null,
) {
  try {
    const updatePromises = [rebindGlobalWorldbooks(newSelections)];

    if (variableData) {
      updatePromises.push(
        insertOrAssignVariables({ joezhangynLastBindState: variableData }, SCRIPT_VAR),
      );
    }

    const results = await Promise.allSettled(updatePromises);
    const failures = results.filter((r) => r.status === "rejected");

    if (failures.length > 0) {
      for (const f of failures) {
        const msg = f.reason?.message || "";
        if (msg.includes("未找到")) {
          console.warn("[世界书管理] 检测到不存在的世界书，已自动跳过。");
        } else {
          console.error("[世界书管理] 部分操作失败:", f.reason);
        }
      }
    }

    console.log(
      `[世界书管理] 设置已更新。当前启用: ${newSelections.length} 本`,
    );
    return failures.length === 0;
  } catch (error) {
    console.error("[世界书管理] 更新设置失败:", error);
    return false;
  }
}

/**
 * 检查并自动导入内嵌世界书（仅首次导入，不覆盖已有世界书）
 */
async function importEmbeddedWorldbookIfNeeded() {
  try {
    const charData = getCharData("current");
    if (!charData) return null;

    const char = new RawCharacter(charData);
    const book = char.getCharacterBook();
    if (!book?.name) return null;

    const allInstalledBooks = getWorldbookNames();
    if (allInstalledBooks.includes(book.name)) return book.name;

    console.log(`[世界书管理] 发现内嵌世界书 "${book.name}"，正在导入...`);

    try {
      const entries = (book.entries || []).map((e) => ({
        name: e.comment || "",
        enabled: e.enabled ?? true,
        content: e.content || "",
        strategy: {
          type: e.constant ? "constant" : "selective",
          keys: e.keys || [],
          keys_secondary: {
            logic: "and_any",
            keys: e.secondary_keys || [],
          },
        },
        position: {
          order: e.insertion_order ?? 100,
        },
      }));

      await createWorldbook(book.name, entries);

      console.log(
        `[世界书管理] "${book.name}" 导入成功，共 ${entries.length} 条`,
      );
      return book.name;
    } catch (importError) {
      console.error(`[世界书管理] 导入 "${book.name}" 出错:`, importError);
      try {
        await deleteWorldbook(book.name);
      } catch (e) {}
      return null;
    }
  } catch (error) {
    console.error("[世界书管理] 自动导入内嵌书失败:", error);
  }
  return null;
}

// 核心逻辑执行函数
async function executeBindingLogic() {
  try {
    const embeddedBookName = await importEmbeddedWorldbookIfNeeded();

    const [global_worldbooks, char_worldbooks, chat_worldbook, scriptVars] =
      await Promise.all([
        getGlobalWorldbookNames(),
        getCharWorldbookNames("current"),
        getOrCreateChatWorldbook("current"),
        getVariables(SCRIPT_VAR),
      ]);

    const currentGlobalSelection = new Set(global_worldbooks || []);
    const originalSelectionJson = toSortedJson(currentGlobalSelection);

    const lastState = scriptVars?.joezhangynLastBindState || {};
    const lastCharBooks = normalizeWorldbookNames(lastState.Char_Worldbooks);
    const lastChatBook = lastState.Chat_Worldbook;

    const currentUserCharBooks = normalizeWorldbookNames(char_worldbooks);
    if (embeddedBookName) {
      currentUserCharBooks.add(embeddedBookName);
    }

    for (const book of lastCharBooks) currentGlobalSelection.delete(book);

    if (lastChatBook) {
      currentGlobalSelection.delete(lastChatBook);
      if (lastChatBook !== chat_worldbook)
        checkAndDeleteEmptyWorldbook(lastChatBook);
    }

    for (const book of currentUserCharBooks) currentGlobalSelection.add(book);
    if (chat_worldbook) currentGlobalSelection.add(chat_worldbook);

    const newSelectionArray = Array.from(currentGlobalSelection);
    const newSelectionJson = toSortedJson(newSelectionArray);

    const variableData = {
      Char_Worldbooks: Array.from(currentUserCharBooks),
      Chat_Worldbook: chat_worldbook,
    };

    if (originalSelectionJson !== newSelectionJson) {
      console.log("[世界书管理] 状态变更，正在同步...");
      await updateGlobalWorldbookSettings(newSelectionArray, variableData);
    } else {
      const lastVariableJson = JSON.stringify(lastState.Char_Worldbooks);
      const currentVariableJson = JSON.stringify(variableData.Char_Worldbooks);

      if (
        lastVariableJson !== currentVariableJson ||
        lastChatBook !== chat_worldbook
      ) {
        await insertOrAssignVariables(
          { joezhangynLastBindState: variableData },
          SCRIPT_VAR,
        );
      }
    }
  } catch (error) {
    console.error("[世界书管理] 绑定逻辑错误:", error);
  }
}

// 主函数: 带并发锁的防抖执行
async function BindUnBindGlobalWorldbook() {
  const thisTimestamp = Date.now();
  lastChatChangeTimestamp = thisTimestamp;
  const isObsolete = () => lastChatChangeTimestamp !== thisTimestamp;

  const delays = [300, 900, 1300];
  for (const ms of delays) {
    await delay(ms);
    if (isObsolete()) return;
    await executeBindingLogic();
  }

  if (!isObsolete()) {
    await cleanupEmptyChatWorldbooks();
  }
}

// 角色删除清理
async function UnBindGlobalWorldbookDelete() {
  const thisTimestamp = Date.now();
  lastChatChangeTimestamp = thisTimestamp;

  try {
    const [global_worldbooks, scriptVars] = await Promise.all([
      getGlobalWorldbookNames(),
      getVariables(SCRIPT_VAR),
    ]);

    const selectedWorldbooksSet = new Set(global_worldbooks || []);
    const lastState = scriptVars?.joezhangynLastBindState || {};
    const lastCharBooks = normalizeWorldbookNames(lastState.Char_Worldbooks);
    const lastChatBook = lastState.Chat_Worldbook;

    for (const book of lastCharBooks) {
      selectedWorldbooksSet.delete(book);
      checkAndDeleteEmptyWorldbook(book);
    }

    if (lastChatBook) {
      selectedWorldbooksSet.delete(lastChatBook);
      checkAndDeleteEmptyWorldbook(lastChatBook);
    }

    await updateGlobalWorldbookSettings(Array.from(selectedWorldbooksSet));
    console.log("[世界书管理] 已清理删除角色的相关绑定");
  } catch (error) {
    console.error("[世界书管理] 删除清理失败:", error);
  }

  await cleanupEmptyChatWorldbooks();
}

// 注册事件
eventOn(tavern_events.CHAT_CHANGED, BindUnBindGlobalWorldbook);
eventOn(tavern_events.CHARACTER_DELETED, UnBindGlobalWorldbookDelete);