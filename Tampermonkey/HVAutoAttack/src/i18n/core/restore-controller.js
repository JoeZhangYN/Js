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

import { reverseLookup } from "../../data/i18n/reverse-dict.js";
import { EQUIP_ITEMS, EQUIP_INFO, EQUIP_EXTRA } from "../../data/i18n/equip-dict.js";
import { SPELL_TYPE, EQ_CATEGORY, AB_CATEGORY } from "../../data/i18n/hvut-terms.js";
import { INTERFACE_WORDS } from "../../data/i18n/interface-dict.js";
import { langPostProcess } from "./lang-post.js";
import { g } from "../../state/store.js";
import { I18N_RESTORE_FAILURE_KEY, recordI18nRestoreFailure } from "./restore-failure.js";

export { I18N_RESTORE_FAILURE_KEY };

/** @type {Array<() => void>} 各翻译引擎注册的原文/译文交换回调 */
const restoreCallbacks = [];
/** @type {Array<() => void>} 各引擎注册的“按当前 lang 重新翻译自己”回调（lang 切换重翻用） */
const retranslateCallbacks = [];
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
      recordI18nRestoreFailure("restore", e);
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

/**
 * 注册“按当前 lang 重新翻译”回调（去重）。各引擎 init 时注册一次。
 * @param {() => void} fn 清空自己 translatedList 并对当前(已还原英文的)DOM 重新翻译（译文过 langPostProcess）
 */
export function registerRetranslate(fn) {
  if (typeof fn === "function" && !retranslateCallbacks.includes(fn)) {
    retranslateCallbacks.push(fn);
  }
}

// ============================================================================
// 声明式 i18n 绑定（Stage G·复杂度下沉）：把「lang 切换时重渲染」这一半责任从消费者下沉到框架。
// 背景（已诊断的半成品抽象）：hvaaT/t() 只下沉了「按当前 lang 返回翻译」，切换重渲染散落成「各引擎
// 自己 registerRetranslate + 手写重渲染」。自渲染组件(菜单/装备名)接 hvaaT 后切换无效，必须再手动补一遍。
// 本抽象让消费者「声明一次(节点↔渲染函数)」即获显示 + 即时切换全套：setLang 自动重调所有绑定的 render。
// ============================================================================

/** @type {Array<{node: Node, render: () => void}>} 声明式绑定：节点 + 其重渲染函数 */
const i18nRenders = [];

/**
 * 登记节点的重渲染函数（立即渲染一次 + 注册）。lang 切换时框架自动重调（复杂度下沉，消费者零额外代码）。
 * @param {Node} node 承载文案的节点（isConnected 检查回收 detached 节点）
 * @param {() => void} render 重渲染函数（闭包内调 t()/拼接，按当前 lang 重设 node 内容）
 */
export function registerI18nRender(node, render) {
  if (node && typeof render === "function") {
    render();
    i18nRenders.push({ node, render });
  }
}

/** lang 切换时重调所有声明式绑定的 render；顺带清理已从 DOM 移除的节点（防泄漏）。 */
function rerenderAllI18n() {
  for (let i = i18nRenders.length - 1; i >= 0; i -= 1) {
    const { node, render } = i18nRenders[i];
    if (node && node.isConnected) {
      try { render(); } catch (e) { recordI18nRestoreFailure("i18nRender", e); }
    } else {
      i18nRenders.splice(i, 1);
    }
  }
}

/**
 * lang 显示态执行器：运行时切语言即时生效。render.js 切语言时调用（调用前已 g("lang") 置新值 + 持久化）。
 * ①确保还原所有引擎到英文原文 ②lang=2 停在英文 ③lang=0/1 调度各引擎重翻（译文经 langPostProcess 出繁/简）。
 * @param {string|number} newLang 0 简 / 1 繁 / 2 英
 */
export function setLang(newLang) {
  if (translatedState) {
    for (const fn of restoreCallbacks) {
      try { fn(); } catch (e) { recordI18nRestoreFailure("restore", e); }
    }
    translatedState = false;
  }
  if (String(newLang) === "2") {
    rerenderAllI18n(); // 声明式绑定(菜单等自渲染)即时出英文
    if (changer) changer.innerHTML = "中"; // 英文态，按钮点击切回中文
    return;
  }
  for (const fn of retranslateCallbacks) {
    try { fn(); } catch (e) { recordI18nRestoreFailure("retranslate", e); }
  }
  rerenderAllI18n(); // 声明式绑定(菜单等自渲染)即时出简/繁
  translatedState = true;
  if (changer) changer.innerHTML = "英";
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

// ============================================================================
// 横切 DOM SSOT 协调器（Stage B）：英文逻辑态 ↔ 中文显示态的单一读写出口。
// 写方（i18n 翻译）登记英文原文 + 跳过 data-i18n-skip 子树；读方（hv-utils/百分位）经 resolveEn 拿回英文。
// 不变量「逻辑键必须基于英文」从散落注释归位到这两个出口（配合 Stage F node probe 机械锁）。
// caller 契约：resolveEn 的 caller 必须是"读 DOM 文本当英文逻辑 key"的点；registerTranslation 的
// caller 必须是翻译写方（写 DOM 显示文本前登记英文原文）。
// ============================================================================

/** 节点 → 英文原文（写方登记，resolveEn 优先查；WeakMap 随节点销毁自动回收） */
const enByNode = new WeakMap();

/** 增强读方注入的子树打此属性，翻译写方遇到整段跳过（消"翻译覆盖注入节点 / 双翻自渲染中文"轴 B） */
export const SKIP_ATTR = "data-i18n-skip";

/**
 * 登记节点的英文原文（翻译写方改写前调用，去重；原文一旦登记不被后续翻译覆盖）。
 * @param {Node} node 文本节点或元素
 * @param {string} enText 英文原文
 */
export function registerTranslation(node, enText) {
  if (node && typeof enText === "string" && !enByNode.has(node)) {
    enByNode.set(node, enText);
  }
}

/**
 * 读出口：拿回节点的英文逻辑 key。① 节点登记原文（textNode 级精确）→ ② 逆表反查中文文本
 * （group 缩小歧义）→ ③ 未命中返 undefined（调用方 `?? 原值` 回退）。
 * 退化安全：英文态/未翻时 textContent 本就是英文，逆表 miss 返 undefined，调用方回退即原英文。
 * @param {Node|string} nodeOrText 节点（读其 textContent）或直接中文串
 * @param {string=} group 逆表词典组（'characterStatus'/'trains'/'character'/'quality'）
 * @returns {string|undefined}
 */
export function resolveEn(nodeOrText, group) {
  if (nodeOrText && typeof nodeOrText === "object" && "nodeType" in nodeOrText) {
    if (enByNode.has(nodeOrText)) return enByNode.get(nodeOrText);
    return reverseLookup(nodeOrText.textContent || "", group);
  }
  return reverseLookup(String(nodeOrText == null ? "" : nodeOrText), group);
}

/**
 * 节点自身或任一祖先是否带 data-i18n-skip（翻译写方据此跳过子树）。
 * @param {Node} node
 * @returns {boolean}
 */
export function isSkipped(node) {
  let el = node && node.nodeType === 3 ? node.parentElement : node;
  while (el && el.hasAttribute) {
    if (el.hasAttribute(SKIP_ATTR)) return true;
    el = el.parentElement;
  }
  return false;
}

// ============================================================================
// 正向翻译出口 t()（Stage G）：英文逻辑值 → 当前 lang 显示中文，单一 canonical SSOT。
// hv-utils 自渲染（物品/材料/分类/装备名）经全局桥调此出口，替代其私有 HVAA_ITEM_CN/HVUT_CN
// 漂移表（同一术语两套译名 → 内部 panel 中文 ≠ 外部游戏 DOM 中文的根因）。仅翻显示，逻辑值保英文。
// ============================================================================

/** group → 正向 canonical 词典（英→简）。其余界面组走 INTERFACE_WORDS[group] 兜底。 */
const FORWARD_DICTS = {
  item: EQUIP_ITEMS,
  material: EQUIP_ITEMS,
  eqCategory: EQ_CATEGORY,
  abCategory: AB_CATEGORY,
  spell: SPELL_TYPE,
};

/**
 * 正向翻译：英文逻辑值 → 当前 lang 显示文本。
 * ① lang=2(英) 返原值（自渲染同步出英文）② group 词典命中 → langPostProcess(简→当前 lang)
 * ③ 未命中 → 跨 EQUIP_* 兜底 ④ 全 miss 返英文原值（退化安全，不崩、不静默错值）。
 * @param {string} value 英文逻辑值
 * @param {string=} group 词典组（'item'|'material'|'eqCategory'|'abCategory'|'spell'|…）
 * @returns {string}
 */
export function t(value, group) {
  if (typeof value !== "string" || !value) return value;
  if (String(g("lang")) === "2") return value;
  let zh;
  const dict = FORWARD_DICTS[group] || (group ? INTERFACE_WORDS[group] : undefined);
  if (dict) zh = dict[value];
  if (zh == null) zh = EQUIP_ITEMS[value] ?? EQUIP_INFO[value] ?? EQUIP_EXTRA[value];
  return zh != null ? langPostProcess(zh) : value;
}

// hv-utils.js 是非 ESM sloppy-mode 第三方脚本（加 import 会触发 strict mode 撞 `protected` 等保留字标识符，
// 无法 import 本模块），经全局桥暴露协调器读出口供其 IIFE 消费（Stage C/D/G 读源归一）。
if (typeof window !== "undefined") {
  window.HVAA_i18n = { resolveEn, t, registerTranslation, isSkipped, SKIP_ATTR, registerI18nRender };
}
