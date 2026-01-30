// ============ 世界书自定义真实排序 ============
// 初始化脚本变量（不存在时写入默认值 0 秒）
insertVariables({ joezhangynRefractory: 0 }, { type: "script" });

let sortTimer = null;
let isSorting = false;
let pendingName = null;

const POS_RANK = {
  before_character_definition: 1,
  after_character_definition: 2,
  before_example_messages: 3,
  after_example_messages: 4,
  before_author_note: 5,
  after_author_note: 6,
};
const ROLE_RANK = { assistant: 1, user: 2, system: 3 };

function sortKey(e) {
  const enabled = e.enabled ? 0 : 1;
  const p = e.position;
  if (p.type === "at_depth") {
    return [
      enabled,
      1,
      -(p.depth || 0),
      ROLE_RANK[p.role] || 99,
      p.order || 0,
      e.uid,
    ];
  }
  return [enabled, 0, 0, POS_RANK[p.type] || 999, p.order || 0, e.uid];
}

function getRefractory() {
  return getVariables({ type: "script" }).joezhangynRefractory ?? 0;
}

async function sortWorldbook(name) {
  if (isSorting) return;
  isSorting = true;

  try {
    const entries = await getWorldbook(name);
    const originalUids = entries.map((e) => e.uid);

    const sorted = [...entries].sort((a, b) => {
      const ka = sortKey(a),
        kb = sortKey(b);
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return ka[i] - kb[i];
      }
      return 0;
    });

    if (sorted.every((e, i) => e.uid === originalUids[i])) return;

    await replaceWorldbook(name, sorted, { render: "debounced" });
    toastr.success(`[排序] "${name}" 完成`);
    console.log(`[排序] "${name}" 完成`);
  } catch (err) {
    console.error("[排序] 出错:", err);
  } finally {
    setTimeout(() => {
      isSorting = false;
    }, 200);
  }
}

eventOn(tavern_events.WORLDINFO_UPDATED, (name) => {
  if (isSorting) return;
  pendingName = name;
  if (sortTimer) clearTimeout(sortTimer);
  sortTimer = setTimeout(() => {
    sortTimer = null;
    pendingName = null;
    sortWorldbook(name);
  }, getRefractory() * 1000);
});

eventOn(getButtonEvent("立即排序"), async () => {
  if (sortTimer) {
    clearTimeout(sortTimer);
    sortTimer = null;
  }
  const name = pendingName;
  pendingName = null;

  if (name) {
    await sortWorldbook(name);
  } else {
    toastr.info("当前没有待排序的世界书");
  }
});

eventOn(getButtonEvent("排序设置"), async () => {
  const current = getRefractory();
  const input = await SillyTavern.callGenericPopup(
    "设置世界书排序不应期(单位秒支持小数) 0 = 立即排序",
    SillyTavern.POPUP_TYPE.INPUT,
    String(current),
  );
  if (input !== false) {
    const value = Math.max(0, parseFloat(input) || 0);
    insertOrAssignVariables(
      { joezhangynRefractory: value },
      { type: "script" },
    );
    toastr.success(`不应期: ${value}秒`);
  }
});