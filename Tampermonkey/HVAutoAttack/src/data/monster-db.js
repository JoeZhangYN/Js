// 怪物九抗数据：scan 日志解析 + 校验 + 类型。
// **PURE**：仅做字符串→对象解析，不碰 DOM/网络/存储（副作用在 battle/monster-db-sync.js 与 state/monster-db-store.js）。
//
// 移植自 SukkaW/hv-monsterdb-userscript（MIT, Copyright (c) 2021 Sukka）
//   - rMatchScan 正则 + parseScanResult：src/lib/parseLog.ts
//   - checkScanResultValidity + EFFECTS 正则：src/lib/monster.ts
//   - MonsterInfo 字段：src/types.ts
// 仅取"查九抗"最小子集；编码层(monsterDataEncode)按需略去——上游全量 JSON 已是明文。

/**
 * 怪物画像（抗性 + 身份 + scan 实测战斗参数）。社区同步 + scan 自采共用；库主键 = monsterId。
 * scan 字段（accuracy..spPct）来自实测 scan 面板，社区同步无（缺=undefined，additive 不破旧记录）。
 * @typedef {object} MonsterInfo
 * @property {number} [monsterId] 全局怪物 MID（社区库主键 / 战场 spawn 行；scan 自采经战场 name→MID 补）
 * @property {string} monsterName
 * @property {string} monsterClass
 * @property {number} plvl 固有 Power Level（系统怪无 PL → 0；≠ 战斗 level）
 * @property {string} [attack] 攻击类型（Piercing/Crushing/.../Void）
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
 * @property {number} [accuracy]   melee 命中力（scan）
 * @property {number} [hitChance]  对玩家命中率 %（scan；越高威胁越大）
 * @property {number} [evade]      闪避力（scan）
 * @property {number} [evadeVsAttack] 闪避玩家物理 % base（scan）
 * @property {number} [evadeVsMagic]  闪避玩家法术 % base（scan；高→物理更稳）
 * @property {number} [parry]      招架力（scan）
 * @property {number} [parryChance] 招架玩家物理 % base（scan）
 * @property {number} [magicResist] 法术抵抗力（scan）
 * @property {number} [magicResistChance] 抵抗玩家法术 % base（scan；高→物理更稳）
 * @property {number} [mpPct]      怪当前 MP%（scan）
 * @property {number} [spPct]      怪当前 SP%（scan）
 * @property {number} [curHP]      scan 时当前血（绝对）
 * @property {number} [maxHP]      满血（scan `HP: cur/max` 的 max；或死亡反推兜底）
 */

/** 九抗字段名（顺序固定，与 scan/sync 解析 + UI 显示 + 视图 join 一致）。@type {readonly string[]} */
export const RESIST_KEYS = [
  "fire", "cold", "elec", "wind", "holy", "dark", "crushing", "slashing", "piercing",
];

// scan 面板逐字段抽取（替代旧上游单条巨正则）。
// **为何重写**：当前 HV scan 面板 (1) 跨多行——旧正则用 `.` 不跨行；(2) Trainer 行排在 Class 之前
// ——旧正则期望 Class 在前；二者致旧 R_SCAN 对当前 HV **NO MATCH**（实测 2026-06-25，自采 scan 全失效）。
// 治法：先 `\s+→" "` 归一多行/缩进，再各字段聚焦正则（顺序无关，比单条巨正则更鲁棒、易扩展新字段）。
const R_SCAN = {
  name: /Scanning (.+?)\.\.\./,
  hp: /HP:\s*(\d+)\s*\/\s*(\d+)/,
  mp: /MP:\s*(\d+)%/,
  sp: /SP:\s*(\d+)%/,
  trainer: /Monster Trainer:<\/strong><\/td>\s*<td[^>]*>([^<]*)</,
  klass: /Monster Class:<\/strong><\/td>\s*<td[^>]*>([A-Z][a-z]+)(?:,\s*Power Level\s*(\d+))?/,
  attack: /Melee Attack:<\/strong><\/td>\s*<td[^>]*>(\w+);\s*Accuracy\s*([\d.]+)\s*\(([\d.]+)% hit/,
  evade: /Evade\s*([\d.]+)\s*\(([\d.]+)% base chance vs player attack,\s*([\d.]+)% base chance vs player magic\)/,
  parry: /Parry\s*([\d.]+)\s*\(([\d.]+)% base chance vs player attack\)/,
  mresist: /Resist\s*([\d.]+)\s*\(([\d.]+)% base chance vs player magic\)/,
};
const RESIST_LABELS = {
  fire: "Fire", cold: "Cold", elec: "Elec", wind: "Wind", holy: "Holy",
  dark: "Dark", crushing: "Crushing", slashing: "Slashing", piercing: "Piercing",
};

// 会改变怪物显示抗性的 debuff/状态 —— 命中则 scan 结果不可信，必须丢弃（否则把虚假抗性写库）。
const EFFECTS_AFFECTING_SCAN =
  /nbardead|imperil|firedot|coldslow|elecweak|windmiss|holybreach|darknerf/;

const sign = (s) => (s === "+" ? 1 : -1);

/**
 * 解析单条 "Scanning ..." 日志 HTML → MonsterInfo（失败/非 scan 行返回 null，不抛）。
 * 必备锚 = 怪名 + Class + 九抗齐（缺则丢弃，与旧"抗性不全不入库"语义一致）；其余字段缺=undefined。
 * @param {string} logHtml 单条日志行的 innerHTML（当前 HV 跨多行，内部归一处理）
 * @param {string} today YYYY-MM-DD（由调用方传入，PURE 不取系统时间）
 * @returns {MonsterInfo|null}
 */
export function parseScanResult(logHtml, today) {
  if (!logHtml || !logHtml.includes("Scanning")) return null;
  const html = logHtml.replace(/\s+/g, " "); // 归一多行/缩进 → 单空格（修跨行失配）
  const name = html.match(R_SCAN.name);
  const klass = html.match(R_SCAN.klass);
  if (!name || !klass) return null;

  /** @type {MonsterInfo} */
  const info = {
    monsterName: name[1].trim(),
    monsterClass: klass[1],
    plvl: Number(klass[2] ?? 0), // 系统怪无 Power Level → 0
    trainer: (html.match(R_SCAN.trainer)?.[1] ?? "").trim(),
    lastUpdate: today,
  };

  // 九抗（必备齐）
  for (const k of RESIST_KEYS) {
    const rm = html.match(new RegExp(RESIST_LABELS[k] + ":<\\/div><div[^>]*>([+-])(\\d+)%"));
    if (!rm) return null;
    info[k] = Number(rm[2]) * sign(rm[1]);
  }
  if (RESIST_KEYS.some((k) => Number.isNaN(info[k])) || Number.isNaN(info.plvl)) return null;

  // 可选实测战斗参数（缺=undefined，additive）
  const atk = html.match(R_SCAN.attack);
  if (atk) { info.attack = atk[1]; info.accuracy = Number(atk[2]); info.hitChance = Number(atk[3]); }
  const hp = html.match(R_SCAN.hp);
  if (hp) { info.curHP = Number(hp[1]); info.maxHP = Number(hp[2]); }
  const mp = html.match(R_SCAN.mp); if (mp) info.mpPct = Number(mp[1]);
  const sp = html.match(R_SCAN.sp); if (sp) info.spPct = Number(sp[1]);
  const ev = html.match(R_SCAN.evade);
  if (ev) { info.evade = Number(ev[1]); info.evadeVsAttack = Number(ev[2]); info.evadeVsMagic = Number(ev[3]); }
  const pa = html.match(R_SCAN.parry);
  if (pa) { info.parry = Number(pa[1]); info.parryChance = Number(pa[2]); }
  const mr = html.match(R_SCAN.mresist);
  if (mr) { info.magicResist = Number(mr[1]); info.magicResistChance = Number(mr[2]); }

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
