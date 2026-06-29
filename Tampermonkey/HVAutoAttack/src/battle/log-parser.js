// 战斗日志解析（PoC，L1 资源约束优化的 ground truth feed）。
// 从 #textlog>tbody>tr>td 文本提取伤害事件 → 聚合为玩家承受 DPS / 怪物输出 DPS。
// **PURE-ish**：仅取 textContent，不缓存 Element。返 plain object 数组。
import { gE } from "../dom/query.js";
import { normalizeMonsterName } from "../monster/monster-identity.js";

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
  const q = (p) =>
    dmgs.length === 0 ? 0 : dmgs[Math.min(dmgs.length - 1, Math.floor(dmgs.length * p))];
  const p50 = q(0.5);
  const p95 = q(0.95);
  const hitsPerTurn = incoming.length / t;
  const perTurnP95 = p95 * hitsPerTurn;
  return {
    total,
    perTurn: total / t,
    p50,
    p95,
    hitsPerTurn,
    perTurnP95,
    sampleCount: incoming.length,
  };
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
 * 从开局 spawn 日志解析每怪身份画像 {monsterId, name, level, maxHP}。
 * HV 每轮开局日志：最后一条 `Initializing ...`，往前每怪一行（实测 2026-06-25）：
 *   `Spawned Monster <X>: MID=<id> (<name>) LV=<lv> HP=<maxhp>`
 * **MID/LV 一直躺在同一行被旧 parseMonsterMaxHP 用 `HP=(\d+)$` 只取行尾血而丢弃**；本函数同一行
 * 连 monsterId/name/level 一并取。**PURE**：只读 battleLog 文本，不碰 DOM/全局。
 * 保留旧倒序遍历（order 0..monsterAll-1 已验证对齐战场槽位 mkey）；slot 字母(A=0..)可作未来校验，
 * 当前仍按位置定 order（与旧行为逐一致，零回归）。
 * 退化两级：① 行匹配 MID/LV 失败但有行尾 `HP=` → 仅 maxHP（id/level undefined）；
 *           ② 整行无 HP → maxHP=null（占位，由 buildMonsterStatus 落 hpInferred）。
 * 关键纠正：LV(战斗等级，决定 HP) ≠ scan 的 Power Level(怪固有强度)。
 * @param {string[]} battleLogRows `#textlog>tbody>tr>td` 文本行
 * @param {number} monsterAll 怪物总数
 * @returns {{roster:Array<{monsterId?:number,name?:string,level?:number,maxHP:(number|null)}>, allParsed:boolean}}
 */
export function parseMonsterRoster(battleLogRows, monsterAll) {
  const roster = [];
  let allParsed = true;
  let lastHp = null; // carry-forward（保留旧 parseMonsterMaxHP 的非首怪沿用上一有效值行为）
  for (let i = battleLogRows.length - 2; i > battleLogRows.length - 2 - monsterAll; i--) {
    const text = battleLogRows[i] || "";
    const full = text.match(/MID=(\d+) \((.+)\) LV=(\d+) HP=(\d+)$/);
    if (full) {
      lastHp = parseInt(full[4], 10);
      roster.push({
        monsterId: parseInt(full[1], 10),
        name: full[2],
        level: parseInt(full[3], 10),
        maxHP: lastHp,
      });
      continue;
    }
    const hpOnly = text.match(/HP=(\d+)$/);
    if (hpOnly) {
      lastHp = parseInt(hpOnly[1], 10);
      roster.push({ maxHP: lastHp }); // 退化①：有血无 MID/LV（旧格式/异常）
      allParsed = false;
      continue;
    }
    // 退化②：整行无 HP → carry-forward 旧血（无前值则 null = 占位）
    roster.push({ maxHP: lastHp });
    allParsed = false;
  }
  return { roster, allParsed };
}

/**
 * 把 spawn 解析的 roster 组装为 monsterStatus 记录。供 monster-status-automation 统一写入。
 * **三个 id 概念显式区分（命名锁）**：
 *   - `id`        = 战场槽位 mkey(0-9)，点击用（id = order===9 ? 0 : order+1）；
 *   - `monsterId` = 全局怪物 MID（spawn 行 / 社区库主键 / maxHP·画像库主键）；
 *   - `level`     = 本场战斗等级 LV（决定 maxHP；≠ 固有 Power Level）。
 * hpInferred=true 标记该位 hp 是占位（开局 `HP=` 未解析到 → 非真实满血），供 applyInferredMaxHp
 * 用 (monsterId,level) 反推/缓存值兜底；显式标记替代「st.hp===100000 魔数检测」，避免漏 1000 普通占位。
 * @param {Array<{monsterId?:number,name?:string,level?:number,maxHP:(number|null)}>} roster
 * @param {number} [fallbackHp=100000] maxHP 缺失(null)时的保守占位 —— 用大值避免斩杀判断除零/误触发
 * @returns {Array<{order:number,id:number,monsterId?:number,name?:string,level?:number,hp:number,hpInferred:boolean}>}
 */
export function buildMonsterStatus(roster, fallbackHp = 100000) {
  return roster.map((rec, order) => ({
    order,
    id: order === 9 ? 0 : order + 1,
    monsterId: rec?.monsterId,
    name: rec?.name,
    level: rec?.level,
    hp: rec?.maxHP ?? fallbackHp,
    hpInferred: rec?.maxHP == null,
  }));
}

/**
 * 占位 hp 用 (monsterId, level) 键的持久 maxHP 兜底（仅"开局日志整缺"罕见场景）。
 * **PURE**：仅就地改 monsterStatus，不碰 DOM / 全局。真实开局解析（hpInferred=false）永远优先、
 * 不被覆盖；仅占位且 monsterId+level 均已知（来自上一成功开局解析的持久 monsterStatus）且查到
 * 值（>0）才替换 st.hp 并清除标记。替换后 hpNow/finWeight 由修正后的 hp 派生，三量一致。
 * 注：MID 唯一定位具体怪、LV 决定其本场满血，故按 (MID,LV) 键不会跨等级误用。
 * @param {Array<{monsterId?:number, level?:number, hp:number, hpInferred?:boolean}>} monsterStatus 就地修改
 * @param {(monsterId:number, level:number)=>number} lookupMaxHp 查 (MID,LV)→maxHP（缺返 ≤0）
 */
export function applyInferredMaxHp(monsterStatus, lookupMaxHp) {
  for (const st of monsterStatus || []) {
    if (!st.hpInferred || st.monsterId == null || st.level == null) continue;
    const maxHP = lookupMaxHp(st.monsterId, st.level);
    if (maxHP > 0) {
      st.hp = maxHP;
      st.hpInferred = false;
    }
  }
}

/**
 * 按怪物名累计 "monster-taking"（玩家对怪的）伤害（todo 491：HP 反推）。
 * 只聚合 kind === "monster-taking" 的事件；key = normalizeMonsterName(target)（与查表端一致）。
 * **PURE**：无副作用，供 monster-status-hp 内死亡检测调用。
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
