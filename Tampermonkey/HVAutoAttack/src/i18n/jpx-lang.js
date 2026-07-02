// file-size-gate: exempt 第三方 jpx 语言包原样移植
/* eslint-disable */
// ============================================================================
// jpx Chinese Language Pack (jpx, v2026.01.31, 繁体)  [2026-06-03 移植]
//
// 来源:HentaiVerse/jpx Chinese Language Pack.user.js
// 数据/逻辑分离:URL 编码繁体大词典抽到 src/data/i18n/jpx-dict.js
// (export const JPX_DICT,逐字原样),本文件只放逻辑(解码 + 应用 + 守卫)。
//
// 改造要点:
// 1. 原脚本是单一 IIFE,仅做一件事——把 URL 编码的繁体词典 decode 后挂到
//    window.jpxI18N(供 jpx 战斗/统计主脚本读取)。无任何 DOM hook/querySelector/
//    文本替换,纯数据发布。
// 2. decodeI18N 解码器(纯函数)留本模块作用域,沿用原 decodeURIComponent。
// 3. 应用逻辑(window.jpxI18N = {...})搬进 initJpxLang(),由入口副作用调用。
// 4. 原 @exclude *hentaiverse.org/equip/* 与 isekai/equip/* 改运行时守卫复现
//    (嵌入后无法用 @exclude,否则会排掉 HVAA 自身)。try-catch 隔离,崩溃不阻断主逻辑。
// ============================================================================

import { JPX_DICT } from "../data/i18n/jpx-dict.js";
import { recordI18nInitFailure } from "./core/init-failure.js";

function decodeI18N(value) {
	if (typeof value === 'number' || typeof value === 'boolean' || value == null) return value;
	if (Array.isArray(value)) return value.map(decodeI18N);

	if (typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, decodeI18N(v)])
		);
	}

	return decodeURIComponent(value);
}

export function initJpxLang() {
	try {
		var p = location.pathname || "";
		if (location.host.indexOf("hentaiverse.org") === -1) return;
		if (/\/equip(\/|$)/.test(p)) return;
		// 原 IIFE 内唯一的应用逻辑:把解码后的词典发布到 window.jpxI18N,
		// 供 jpx 战斗/统计主脚本读取(本脚本不直接改 DOM)。
		window.jpxI18N = { ...window.jpxI18N, ...decodeI18N(JPX_DICT) };
	} catch (e) {
		recordI18nInitFailure("jpx", e);
	}
}
