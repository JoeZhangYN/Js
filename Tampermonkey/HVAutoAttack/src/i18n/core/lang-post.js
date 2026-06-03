// lang 末端后处理：各 en→zh 引擎产出的简体译文，写入 DOM 前按当前 lang 统一转形。
// 接通 zh-convert 孤岛：lang=1 转繁，lang=0/其它原样简体；lang=2 不应到这步
// （lang=2 由 RestoreController.setLang 还原英文原文，不重翻）。纯函数。
import { convertByLang } from "../zh-convert.js";
import { g } from "../../state/store.js";

/**
 * 按当前 g("lang") 后处理简体译文字符串。
 * @param {string} s 简体译文（可含 HTML 标签；toTraditional 只转中文字符，标签/英文不动）
 * @returns {string}
 */
export function langPostProcess(s) {
  if (typeof s !== "string" || !s) return s;
  return convertByLang(s, g("lang"));
}
