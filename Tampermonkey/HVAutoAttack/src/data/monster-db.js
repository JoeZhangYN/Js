// 怪物九抗数据：scan 日志解析 + 校验 + 类型。
// **PURE**：仅做字符串→对象解析，不碰 DOM/网络/存储（副作用在 battle/monster-db-sync.js 与 state/monster-db-store.js）。
//
// 移植自 SukkaW/hv-monsterdb-userscript（MIT, Copyright (c) 2021 Sukka）
//   - rMatchScan 正则 + parseScanResult：src/lib/parseLog.ts
//   - checkScanResultValidity + EFFECTS 正则：src/lib/monster.ts
//   - MonsterInfo 字段：src/types.ts
// 仅取"查九抗"最小子集；编码层(monsterDataEncode)按需略去——上游全量 JSON 已是明文。

/**
 * @typedef {object} MonsterInfo
 * @property {string} monsterName
 * @property {string} monsterClass
 * @property {number} plvl Power Level（系统怪无 PL → 0）
 * @property {string} attack 攻击类型（Piercing/Crushing/.../Void）
 * @property {string} trainer
 * @property {number} fire   元素抗性（+ 抗性 / - 弱点，百分比）
 * @property {number} cold
 * @property {number} elec
 * @property {number} wind
 * @property {number} holy
 * @property {number} dark
 * @property {number} crushing 物理抗性
 * @property {number} slashing
 * @property {number} piercing
 * @property {string} lastUpdate YYYY-MM-DD
 * @property {number} [maxHP] 反推满血 HP（从战斗日志累计伤害在怪物死亡时推算，略高估可接受，todo 491）
 */

/** 九抗字段名（顺序固定，与 scan/sync 解析 + UI 显示 + 视图 join 一致）。@type {readonly string[]} */
export const RESIST_KEYS = [
  "fire", "cold", "elec", "wind", "holy", "dark", "crushing", "slashing", "piercing",
];

// scan 结果 HTML 一次性抽取：怪名 / Class / PL / Trainer / Attack + 九抗（符号+数值）。
// 与上游 parseLog.ts rMatchScan 完全一致（HV scan 面板 HTML 结构固定）。
// 注：长正则有理论回溯成本，但 HV scan 面板 HTML 结构固定、长度有限，实测无回溯灾难。
const R_SCAN =
  /Scanning (.+?)\.\.\..+?Monster Class.+>([A-Z][a-z]+)(?:, Power Level (\d+)<|<).+?Monster Trainer:<\/strong><\/td><td>([^<>]*)<.+?<\/strong><\/td><td>([A-Za-z]+)<.+?Fire:.+?>([+-])(\d+)%<.+?Cold:.+?>([+-])(\d+)%<.+?Elec:.+?>([+-])(\d+)%<.+?Wind:.+?>([+-])(\d+)%<.+?Holy:.+?>([+-])(\d+)%<.+?Dark:.+?>([+-])(\d+)%<.+?Crushing:.+?>([+-])(\d+)%<.+?Slashing:.+?>([+-])(\d+)%<.+?Piercing:.+?>([+-])(\d+)%/;

// 会改变怪物显示抗性的 debuff/状态 —— 命中则 scan 结果不可信，必须丢弃（否则把虚假抗性写库）。
const EFFECTS_AFFECTING_SCAN =
  /nbardead|imperil|firedot|coldslow|elecweak|windmiss|holybreach|darknerf/;

const sign = (s) => (s === "+" ? 1 : -1);

/**
 * 解析单条 "Scanning ..." 日志 HTML → MonsterInfo（失败/非 scan 行返回 null，不抛）。
 * @param {string} logHtml 单条日志行的 innerHTML
 * @param {string} today YYYY-MM-DD（由调用方传入，PURE 不取系统时间）
 * @returns {MonsterInfo|null}
 */
export function parseScanResult(logHtml, today) {
  if (!logHtml || !logHtml.includes("Scanning")) return null;
  const m = R_SCAN.exec(logHtml);
  if (!m) return null;

  const info = {
    monsterName: m[1],
    monsterClass: m[2],
    plvl: Number(m[3] ?? 0), // 系统怪无 Power Level → 0
    trainer: m[4],
    attack: m[5],
    fire: Number(m[7]) * sign(m[6]),
    cold: Number(m[9]) * sign(m[8]),
    elec: Number(m[11]) * sign(m[10]),
    wind: Number(m[13]) * sign(m[12]),
    holy: Number(m[15]) * sign(m[14]),
    dark: Number(m[17]) * sign(m[16]),
    crushing: Number(m[19]) * sign(m[18]),
    slashing: Number(m[21]) * sign(m[20]),
    piercing: Number(m[23]) * sign(m[22]),
    lastUpdate: today,
  };

  const nums = [
    info.plvl, info.fire, info.cold, info.elec, info.wind, info.holy,
    info.dark, info.crushing, info.slashing, info.piercing,
  ];
  if (nums.some(Number.isNaN)) return null;
  return info;
}

/**
 * scan 时怪物 HTML 是否被会污染抗性显示的 debuff 影响（imperil/firedot 等）。
 * @param {string|undefined} monsterHtml 该怪物 DOM 的 innerHTML
 * @returns {boolean} true = 干净可入库
 */
export function checkScanResultValidity(monsterHtml) {
  return !!monsterHtml && !EFFECTS_AFFECTING_SCAN.test(monsterHtml);
}
