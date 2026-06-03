// ============================================================================
// 繁简转换层 (zh-convert) — 逻辑  [HVAA i18n]
//
// 用途:
//   HVAA 整合两套汉化 —— indefined 装备汉化(简体)、jpx 语言包(繁体)。
//   本模块按 HVAA 语言设置 lang(0=简体 / 1=繁体 / 2=英文)统一汉化输出:
//     lang=0 全转简体, lang=1 全转繁体, lang=2 由调用方决定不调用本函数(显示英文原文)。
//
// 数据/逻辑分离: 繁简映射表是纯数据 SSOT, 放 src/data/i18n/zh-table.js;
//   本文件只 import 表 + 实现转换逻辑。映射表的覆盖范围/歧义取舍说明见数据模块文件头。
//
// 约束: 纯函数, 无副作用, 无 DOM, 无外部库依赖。
// ============================================================================
import { T2S, S2T } from "../data/i18n/zh-table.js";

/**
 * 繁 → 简。逐字符查表替换(多对一, 可靠主输出)。查不到原样返回。
 * @param {string} s
 * @returns {string}
 */
export function toSimplified(s) {
  if (typeof s !== "string" || s.length === 0) return s;
  let out = "";
  for (const ch of s) out += T2S[ch] || ch;
  return out;
}

/**
 * 简 → 繁。逐字符查表替换(一对多取最常用繁体, 次要路径, 个别字可能不准)。
 * 查不到原样返回。
 * @param {string} s
 * @returns {string}
 */
export function toTraditional(s) {
  if (typeof s !== "string" || s.length === 0) return s;
  let out = "";
  for (const ch of s) out += S2T[ch] || ch;
  return out;
}

/**
 * 按 HVAA 语言设置转换。
 *   lang=1(或 "1"): 转繁体;
 *   lang=0 或其它: 默认转简体(可靠主输出);
 *   lang=2: 由调用方决定不调用本函数(显示英文原文)。
 * @param {string} s
 * @param {number|string} lang
 * @returns {string}
 */
export function convertByLang(s, lang) {
  if (lang === "1" || lang === 1) return toTraditional(s);
  return toSimplified(s); // 默认简体(lang 0 或其它); lang 2 由调用方决定不调用本函数
}
