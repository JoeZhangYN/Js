// 多语言 alert / confirm / prompt 包装。l0=简中 / l1=繁中 / l2=英文。
import { g } from "../state/store.js";

/**
 * 多语言 alert 包装。
 * @param {-1|0|1|2} func -1=返字符串；0=alert；1=confirm；2=prompt
 * @param {string} l0 简体中文
 * @param {string} l1 繁体中文
 * @param {string} l2 English
 * @param {string=} answer prompt 默认值（仅 func=2）
 * @returns {string|boolean|null|undefined}
 */
export function _alert(func, l0, l1, l2, answer) {
  const lang = [l0, l1, l2][g("lang")];
  if (func === -1) return lang;
  if (func === 0) {
    window.alert(lang);
  } else if (func === 1) {
    return window.confirm(lang);
  } else if (func === 2) {
    return window.prompt(lang, answer);
  }
}
