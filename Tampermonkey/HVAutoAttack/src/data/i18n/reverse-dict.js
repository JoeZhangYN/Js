// 中文 → 英文逆表（横切协调器 resolveEn 的字面回退路径）。
//
// 背景：i18n 把 HV 原生英文 DOM 就地翻成中文后，hv-utils/百分位等读方仍用英文 key/正则索引同一节点
// → 中文 key 查英文对象失配（[undefined]、品质门控早退）。本表提供"中文显示文本 → 英文逻辑 key"反查，
// 让读方在节点未登记原文时仍能拿回英文。
//
// 可逆性约束（铁律：逻辑键保英文，只在能唯一回推时回推）：
//   - 仅"纯字面 key + 组内唯一"条目入表可逆；
//   - 正则 key（'/^...$/'）、通配 key（含 *）天然不可逆 → 不入表；
//   - 多对一（同中文多英文，如 Dual wielding/Dual-wielding→双持）→ 标记不可逆（null）剔除；
//   - 大小写多对一（Strength/strength→力量）→ 保留首字母大写规范形式，主世界读点自行 toLowerCase。
// 未命中/不可逆返 undefined，调用方 `?? 原值` 回退（不静默错值）。
// 词典源为简体；繁体态查询前 toSimplified 归一（不预生成简繁双 key）。
//
// 数据源：interface-dict INTERFACE_WORDS（按组分桶）+ equip-dict 品质前缀（strip 装饰符）。
// 被 src/i18n/core/restore-controller.js 的 resolveEn 消费。
import { INTERFACE_WORDS } from "./interface-dict.js";
import { EQUIP_EQUIPS } from "./equip-dict.js";
import { toSimplified } from "../../i18n/zh-convert.js";

const R_IS_REGEXP = /^\/(.+)\/([gim]+)?$/; // 与 interface-translate buildDict 一致：'/^...$/' 视为正则 key
const DECOR_RE = /<[^>]*>|[✧☆✪☯]/g; // 品质装饰：HTML span 标签 + ✧☆✪☯ 符号

/** 纯字面 key（非正则、非通配）才可逆 */
function isLiteralKey(en) {
  return !R_IS_REGEXP.test(en) && en.replace(/\\\*/g, "").indexOf("*") === -1;
}
/** strip 品质装饰（span 标签 + ✧☆✪☯）+ trim */
function stripDecor(zh) {
  return zh.replace(DECOR_RE, "").trim();
}

/** group → Map<简体中文, 英文|null>；null = 探测到多对一，不可逆 */
const byGroup = {};
function add(group, zhRaw, en) {
  const z = toSimplified(String(zhRaw).trim());
  if (!z) return;
  const m = byGroup[group] || (byGroup[group] = new Map());
  if (!m.has(z)) {
    m.set(z, en);
    return;
  }
  const prev = m.get(z);
  if (prev === en || prev === null) return;
  const prevCap = /^[A-Z]/.test(prev);
  const enCap = /^[A-Z]/.test(en);
  if (enCap && !prevCap)
    m.set(z, en); // 大写规范优先（Strength > strength）
  else if (enCap === prevCap) m.set(z, null); // 同形多对一 → 不可逆
}

for (const group of Object.keys(INTERFACE_WORDS)) {
  const dict = INTERFACE_WORDS[group];
  for (const en of Object.keys(dict)) {
    if (isLiteralKey(en)) add(group, dict[en], en);
  }
}
const QUALITY_EN = [
  "Flimsy ",
  "Crude ",
  "Fair ",
  "Average ",
  "Superior ",
  "Fine ",
  "Exquisite",
  "Magnificent",
  "Legendary",
  "Peerless",
];
for (const en of QUALITY_EN) {
  if (EQUIP_EQUIPS[en]) add("quality", stripDecor(EQUIP_EQUIPS[en]), en);
}

/**
 * 中文 → 英文反查。group 缩小歧义（'characterStatus'/'trains'/'character'/'quality' 等）；缺省全局遍历。
 * 不可逆（null）跳过继续找；全部未命中返 undefined。
 * @param {string} text DOM 中文文本（任意 lang 态，内部 toSimplified 归一 + strip 装饰）
 * @param {string=} group 优先匹配的词典组
 * @returns {string|undefined} 英文 key 或 undefined
 */
export function reverseLookup(text, group) {
  if (typeof text !== "string" || !text) return undefined;
  const z = toSimplified(text.trim());
  const zs = stripDecor(z);
  const buckets = group && byGroup[group] ? [byGroup[group]] : Object.values(byGroup);
  for (const m of buckets) {
    const hit = m.get(z) ?? m.get(zs);
    if (hit) return hit; // null（不可逆）falsy → 跳过继续
  }
  return undefined;
}

/** dev 自检：逆表各组规模（Stage B 验收锚——console 打印可逆条目覆盖） */
export function reverseDictStats() {
  const out = {};
  for (const g of Object.keys(byGroup)) {
    let reversible = 0;
    for (const v of byGroup[g].values()) if (v) reversible++;
    out[g] = { total: byGroup[g].size, reversible };
  }
  return out;
}
