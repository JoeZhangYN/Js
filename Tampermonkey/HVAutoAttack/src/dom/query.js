// 纯 DOM 查询 helper（不缓存，每次取最新 DOM）。HV-specific selector 见 dom/selectors.js。
import { itemSelector } from "./selectors.js";

/**
 * DOM 元素查询。
 * - ele 是对象 → 直接返；
 * - ele 是数字字符串 → getElementById；
 * - ele 是其他字符串 → querySelector；
 * - mode="all" → querySelectorAll；
 * - parent 给则在子树查。
 * @param {string|Element} ele
 * @param {"all"|Element=} mode
 * @param {Element=} parent
 */
export function gE(ele, mode, parent) {
  if (typeof ele === "object") return ele;
  if (mode === undefined && parent === undefined) {
    return isNaN(ele * 1) ? document.querySelector(ele) : document.getElementById(ele);
  }
  if (mode === "all") {
    return parent === undefined ? document.querySelectorAll(ele) : parent.querySelectorAll(ele);
  }
  if (typeof mode === "object" && parent === undefined) {
    return mode.querySelector(ele);
  }
}

/** 创建 DOM 元素 */
export function cE(name) {
  return document.createElement(name);
}

/**
 * 检查技能/物品是否可用（opacity !== 0.5）。
 * id > 10000 走 `.bti3>div[onmouseover*="..."]` 物品 selector。
 * @param {string|number} id
 * @returns {Element|false}
 */
export function isOn(id) {
  if (id * 1 > 10000) {
    return gE(itemSelector(id));
  }
  const element = gE(id);
  return element && element.style.opacity !== "0.5" ? element : false;
}

/**
 * 判断 Spirit Stance 按钮是否处于激活态（#ckey_spirit 的 src 含 spirit_a）。
 * 收敛 snapshot / buff / attack 三处重复的 "spirit_a" 字面量判断。
 * @param {Element|null} spiritEl #ckey_spirit 元素
 * @returns {boolean}
 */
export function isSpiritActive(spiritEl) {
  return !!(spiritEl && spiritEl.src.includes("spirit_a"));
}
