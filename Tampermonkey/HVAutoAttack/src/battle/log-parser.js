// 战斗日志解析（PoC，L1 资源约束优化的 ground truth feed）。
// 从 #textlog>tbody>tr>td 文本提取伤害事件 → 聚合为玩家承受 DPS / 怪物输出 DPS。
// **PURE-ish**：仅取 textContent，不缓存 Element。返 plain object 数组。
import { gE } from "../dom/query.js";

/**
 * @typedef {object} DamageEvent
 * @property {"player-incoming"|"monster-taking"} kind
 * @property {string} source 攻击者（玩家攻击 → "you"；怪物攻击 → 怪物名）
 * @property {string} target
 * @property {number} dmg
 * @property {string} type 伤害类型（physical / cold / fire / ...）
 */

/**
 * 解析所有 textlog 行 → DamageEvent[]。
 * @returns {DamageEvent[]}
 */
export function parseBattleLog() {
  const els = gE("#textlog>tbody>tr>td", "all");
  if (!els || !els.length) return [];
  const events = [];
  for (const el of els) {
    const text = el.textContent || "";
    // 玩家被击：`X hits you for Y damage` / `X crits you for Y damage`
    let m = text.match(/^(.+?) (?:hits|crits) you for (\d+) ?(\w+)? damage/);
    if (m) {
      events.push({
        kind: "player-incoming",
        source: m[1].trim(),
        target: "you",
        dmg: parseInt(m[2]),
        type: m[3] || "unknown",
      });
      continue;
    }
    // 玩家攻击命中怪物：`You (?:hit|crit) X for Y damage`
    m = text.match(/^You (?:hit|crit) (.+?) for (\d+) ?(\w+)? damage/);
    if (m) {
      events.push({
        kind: "monster-taking",
        source: "you",
        target: m[1].trim(),
        dmg: parseInt(m[2]),
        type: m[3] || "unknown",
      });
      continue;
    }
    // 怪物技能命中怪物：`X hits Y for Z damage`（注意排除 "you"）
    m = text.match(/^(.+?) hits (.+?) for (\d+) ?(\w+)? damage/);
    if (m && m[2].toLowerCase() !== "you") {
      events.push({
        kind: "monster-taking",
        source: m[1].trim(),
        target: m[2].trim(),
        dmg: parseInt(m[3]),
        type: m[4] || "unknown",
      });
    }
  }
  return events;
}

/**
 * 玩家本场战斗承受总伤害 → 估计 incoming DPS（含 percentile，CVaR 用）。
 * 单次伤害排序后取 p50 / p95，再乘 hits_per_turn 估算保守 per-turn 伤害（compound Poisson 近似）。
 * @param {DamageEvent[]} events
 * @param {number} turn
 * @returns {{total:number, perTurn:number, p50:number, p95:number, hitsPerTurn:number, perTurnP95:number, sampleCount:number}}
 */
export function estimatePlayerIncomingDps(events, turn) {
  const incoming = events.filter((e) => e.kind === "player-incoming");
  const dmgs = incoming.map((e) => e.dmg).sort((a, b) => a - b);
  const total = dmgs.reduce((s, d) => s + d, 0);
  const t = Math.max(1, turn || 1);
  const q = (p) => (dmgs.length === 0 ? 0 : dmgs[Math.min(dmgs.length - 1, Math.floor(dmgs.length * p))]);
  const p50 = q(0.5);
  const p95 = q(0.95);
  const hitsPerTurn = incoming.length / t;
  const perTurnP95 = p95 * hitsPerTurn;
  return { total, perTurn: total / t, p50, p95, hitsPerTurn, perTurnP95, sampleCount: incoming.length };
}

/**
 * 按怪物名聚合 incoming DPS 贡献（用于 monster-specific 估计）。
 * @param {DamageEvent[]} events
 * @param {number} turn
 * @returns {Record<string, {total:number, perTurn:number, count:number}>}
 */
export function estimatePerMonsterDps(events, turn) {
  const map = {};
  const t = Math.max(1, turn || 1);
  for (const e of events) {
    if (e.kind !== "player-incoming") continue;
    if (!map[e.source]) map[e.source] = { total: 0, count: 0 };
    map[e.source].total += e.dmg;
    map[e.source].count += 1;
  }
  for (const k of Object.keys(map)) {
    map[k].perTurn = map[k].total / t;
  }
  return map;
}

/**
 * 从 "Initializing" 开局日志解析每个怪物的真实满血 HP。
 * HV 每轮开局日志结构：最后一条是 `Initializing ...` 行，往前每怪一行以 ` HP=数字` 结尾。
 * **PURE**：只读 battleLog 文本，不碰 DOM/全局。解析不到的位置回退为 null（占位策略交调用方）。
 * 取代旧 new-round.js 内联正则的两个脆弱点：`.match(...)[1]` 无 null 守卫、首怪 NaN 读 `[-1].hp`。
 * @param {Element[]} battleLog `#textlog>tbody>tr>td` 元素数组
 * @param {number} monsterAll 怪物总数
 * @returns {{hps:(number|null)[], allParsed:boolean}} hps 顺序 = order 0..monsterAll-1（与旧 new-round 倒序遍历一致）
 */
export function parseMonsterMaxHP(battleLog, monsterAll) {
  const hps = [];
  let allParsed = true;
  let lastValid = null;
  for (let i = battleLog.length - 2; i > battleLog.length - 2 - monsterAll; i--) {
    const m = (battleLog[i]?.textContent || "").match(/HP=(\d+)$/);
    if (m) {
      lastValid = parseInt(m[1], 10);
      hps.push(lastValid);
    } else {
      // 解析失败：非首怪沿用上一有效值，首怪无前值则 null（lastValid 初始为 null）
      hps.push(lastValid);
      allParsed = false;
    }
  }
  return { hps, allParsed };
}

/**
 * 把每怪 hp 数组组装为 monsterStatus 记录（order / id / hp）。
 * 抽出供 new-round 与 fixMonsterStatus 复用（消除 {order,id,hp} 构造重复）。
 * id 映射保持原约定：id = (order === 9 ? 0 : order + 1)。
 * @param {(number|null)[]} hps
 * @param {number} [fallbackHp=100000] hp 缺失(null)时的保守占位 —— 用大值避免斩杀判断 `hpNow/hp` 除零或误触发
 * @returns {Array<{order:number, id:number, hp:number}>}
 */
export function buildMonsterStatus(hps, fallbackHp = 100000) {
  return hps.map((hp, order) => ({
    order,
    id: order === 9 ? 0 : order + 1,
    hp: hp ?? fallbackHp,
  }));
}

/**
 * 归一怪名：消「战斗日志怪名 ↔ DOM .btm3 怪名」的前导冠词 / 空白差异（todo 491 匹配命门）。
 * 日志正则取 "You hit <target> for"，target 可能含冠词("the Orc")，而 .btm3 多为净名("Orc")，
 * 直接 dmgMap.get 会 miss → 反推静默失效。**匹配两端均过此归一**（accumulate 建键 + countMonsterHP 查键）。
 * 仅用于匹配，不改怪物库存储键（库键须与 monster-db scan 一致，保留原始名）；不 lowercase（避免大小写异名误并）。
 * @param {string} name
 * @returns {string}
 */
export function normalizeMonsterName(name) {
  return (name || "").trim().replace(/\s+/g, " ").replace(/^(?:a|an|the) /i, "");
}

/**
 * 按怪物名累计 "monster-taking"（玩家对怪的）伤害（todo 491：HP 反推）。
 * 只聚合 kind === "monster-taking" 的事件；key = normalizeMonsterName(target)（与查表端一致）。
 * **PURE**：无副作用，供 countMonsterHP 内死亡检测调用。
 * @param {DamageEvent[]} events
 * @returns {Map<string, {totalDamage: number, events: DamageEvent[]}>}
 */
export function accumulateDamageByMonster(events) {
  /** @type {Map<string, {totalDamage: number, events: DamageEvent[]}>} */
  const map = new Map();
  for (const e of events) {
    if (e.kind !== "monster-taking") continue;
    const name = normalizeMonsterName(e.target);
    if (!name) continue;
    if (!map.has(name)) map.set(name, { totalDamage: 0, events: [] });
    const entry = map.get(name);
    entry.totalDamage += e.dmg;
    entry.events.push(e);
  }
  return map;
}
