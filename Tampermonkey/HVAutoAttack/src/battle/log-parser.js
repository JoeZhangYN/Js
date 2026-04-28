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
