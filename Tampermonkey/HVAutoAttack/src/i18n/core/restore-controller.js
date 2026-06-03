// 统一“原文切换”控制器（单例）。
//
// 背景（已确诊 bug）：indefined 装备汉化(equip-translate)与界面汉化(interface-translate)
// 各自创建了同 id="change-translate" 的浮动按钮 + Alt+A 监听 + 各挂自己的 restore handler。
// 后初始化方 getElementById 复用先建按钮、再 addEventListener 第二个语义不同的 handler，
// 导致同一按钮挂两套 restore，点一次只回退其中一套（假解耦：编译期两份、运行时抢同一 DOM 单例）。
//
// 本控制器把“按钮 + Alt+A + 全局显示态文案”上移为唯一单例，各引擎只注册自己的 swap 回调
// （交换各自 translatedList 的原文↔译文 + 翻转其私有 translated）。按钮 click / Alt+A 一次
// 调度全部回调 → 切换一次同时回退所有引擎。lang 显示态执行器（setLang）见 Phase 2。

/** @type {Array<() => void>} 各翻译引擎注册的原文/译文交换回调 */
const restoreCallbacks = [];
/** 全局显示态：true=显示译文(中/繁)，false=显示原文(英) */
let translatedState = true;
/** @type {HTMLElement|null} 唯一 #change-translate 按钮 */
let changer = null;
/** Alt+A 是否已绑（只绑一次） */
let keyBound = false;

/**
 * 注册一个原文/译文交换回调。自动去重（同一函数引用只注册一次），
 * 避免 equip 在多个 case（论坛 / 列表末尾）重复注册导致一次点击翻转多次。
 * @param {() => void} swapFn 仅交换调用方自己 translatedList 的原文↔译文（含翻转其私有 translated），不碰按钮/全局态
 */
export function registerRestore(swapFn) {
  if (typeof swapFn === "function" && !restoreCallbacks.includes(swapFn)) {
    restoreCallbacks.push(swapFn);
  }
}

/** 调度全部已注册回调并翻转全局态 + 更新按钮文案（点按钮 / Alt+A / 程序化切换共用）。 */
function runAll() {
  for (const fn of restoreCallbacks) {
    try {
      fn();
    } catch (e) {
      console.error("[HVAA][i18n] restore 回调出错:", e);
    }
  }
  translatedState = !translatedState;
  if (changer) changer.innerHTML = translatedState ? "英" : "中";
}

/**
 * 确保唯一 #change-translate 按钮存在且可见，并绑定 click / Alt+A（只绑一次）。各引擎翻译完后调用。
 * @returns {HTMLElement} 按钮元素（供调用方做页面特定定制，如论坛页改文案）
 */
export function ensureRestoreButton() {
  if (!changer) {
    changer = document.getElementById("change-translate");
    if (!changer) {
      changer = document.createElement("span");
      changer.innerHTML = "英";
      changer.title = "点击切换翻译";
      changer.id = "change-translate";
      changer.style.cssText =
        "cursor:pointer;z-index:1000;font-size: 16px;position:fixed; top:200px; left:0px; color: white;background : black";
      document.body.appendChild(changer);
    }
    changer.addEventListener("click", runAll);
  }
  changer.style.display = ""; // 确保可见（战斗页 hideButton 后重新显示）
  if (!keyBound) {
    document.addEventListener("keydown", (ev) => {
      if (ev.altKey && (ev.key === "a" || ev.key === "A")) runAll();
    });
    keyBound = true;
  }
  return changer;
}

/** 程序化触发一次全体原文/译文切换（等价点按钮）。供战斗翻译开关调用。 */
export function toggleRestore() {
  runAll();
}

/** 当前是否处于“已翻译”显示态。供动态 observer / alert hook 读取。 */
export function isTranslated() {
  return translatedState;
}

/** 按钮当前是否可见（存在于 document 且未隐藏）。 */
export function isButtonVisible() {
  return !!changer && document.body.contains(changer) && changer.style.display !== "none";
}

/** 隐藏按钮（战斗页用双击 infopane 切换，不显示浮动按钮）。 */
export function hideButton() {
  if (changer) changer.style.display = "none";
}

/** 重新显示按钮。 */
export function showButton() {
  if (changer) changer.style.display = "";
}
