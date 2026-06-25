// 统一怪物视图（business capability SSOT）：把"怪物"业务实体散落的三个面 join 成单一画像。
// snap.monsters(DOM 实时态：百分比/buff/boss/name) + g("monsterStatus")(HP 绝对值/finWeight)
// + monster-db(九抗/plvl/maxHP/身份)。所有 decide 的目标选择从此视图派生（battle/target-strategy.js），
// 不再各自裸读散落字段——根治"同业务多面互相独立 → 目标漂移"（Drain 漂移即此症状）。
// **PURE**：入参全 plain（不读 DOM / 不查 IndexedDB / 不调 g）；db 经 state/monster-cache.js 预取后同步传入。
import { RESIST_KEYS } from "../data/monster-db.js";

// monsterStatus 缺该 order 时的满血/当前血占位（对齐 log-parser.js buildMonsterStatus 的 fallbackHp，
// 用大值避免斩杀判断除零/误触发）。
const FALLBACK_HP = 100000;

/**
 * join 三面成统一怪物视图。**按 order 字段对齐** snap↔monsterStatus（monsterStatus 被 finWeight
 * sort 过——attack.js:121，数组下标≠order，故必须建 Map 按 order 对齐，不能用下标）；按 name 查 monster-db。
 * @param {import("../core/types.js").MonsterFacts[]} snapMonsters snap.monsters（DOM order）
 * @param {Array<{id:number,order:number,isDead:boolean,hp:number,hpNow:number,finWeight:number,inferredMaxHP?:number}>} monsterStatus g("monsterStatus")（finWeight 升序）
 * @param {Record<string, import("../data/monster-db.js").MonsterInfo|null>} [dbByName] 怪名→库记录（monster-cache 预取，缺省空）
 * @returns {import("../core/types.js").UnifiedMonster[]} 保留 snapMonsters 的 order（DOM 序）
 */
export function joinMonsterView(snapMonsters, monsterStatus, dbByName = {}) {
  const statusByOrder = new Map((monsterStatus || []).map((s) => [s.order, s]));
  return (snapMonsters || []).map((m) => {
    const st = statusByOrder.get(m.order);
    const db = dbByName[m.name] || null;
    // 只 maxHP 的库记录（inferAndStoreMaxHP 写的 {monsterName,maxHP}）无九抗 → resists 留 undefined
    const hasResists = !!db && db.fire !== undefined;
    return {
      id: m.id,
      order: m.order,
      name: m.name,
      isDead: m.isDead,
      isBoss: m.isBoss,
      monsterClass: db?.monsterClass,
      powerLevel: db?.plvl,
      attackType: db?.attack,
      buffs: m.buffs,
      buffEffects: m.buffEffects,
      hpPercent: m.hpRatio,
      hpAbsNow: st ? st.hpNow : FALLBACK_HP,
      hpMax: st ? st.hp : FALLBACK_HP,
      inferredMaxHP: st?.inferredMaxHP,
      finWeight: st ? st.finWeight : Infinity,
      resists: hasResists ? Object.fromEntries(RESIST_KEYS.map((k) => [k, db[k]])) : undefined,
      dbMaxHP: db?.maxHP,
    };
  });
}

/**
 * 视图按 order 升序（**含死怪**）。用于需要"order 相邻"语义的场景（如全员 debuff 的 AoE 邻居覆盖：
 * 点 order 相邻下一只，死怪不可点但占位）。纯函数（返新数组）。
 * @param {import("../core/types.js").UnifiedMonster[]} view
 * @returns {import("../core/types.js").UnifiedMonster[]}
 */
export function byOrder(view) {
  return [...(view || [])].sort((a, b) => a.order - b.order);
}

/**
 * 视图里存活的怪，按 order 升序。收编原散落在 decide-cast-all / decide-de-skill / snapshot 的
 * `[...].sort(order).filter(!isDead)` 内联（避免四份漂移）。纯函数（返新数组）。
 * @param {import("../core/types.js").UnifiedMonster[]} view
 * @returns {import("../core/types.js").UnifiedMonster[]}
 */
export function aliveByOrder(view) {
  return byOrder(view).filter((m) => !m.isDead);
}

/**
 * 单怪 HP% 派生量（0..100，对齐条件 hp/mp 口径）。供非门"濒死守卫"等表达：
 * `!soloMonsterHpPercent,4,25` = 仅 1 怪存活且其 HP≤25% 时排除。缺省 100（满血）→ 守卫不误伤。
 * 基于 hpPercent（百分比，与血条口径一致）——血量两概念里这里明确取"百分比"。纯函数。
 * @param {import("../core/types.js").UnifiedMonster[]} view
 * @returns {{soloMonsterHpPercent:number, lowestMonsterHpPercent:number, firstMonsterHpPercent:number}}
 */
export function monsterHpVars(view) {
  const alive = aliveByOrder(view);
  const pct = (r) => r * 100;
  return {
    soloMonsterHpPercent: alive.length === 1 ? pct(alive[0].hpPercent) : 100,
    lowestMonsterHpPercent: alive.length ? pct(Math.min(...alive.map((m) => m.hpPercent))) : 100,
    firstMonsterHpPercent: alive.length ? pct(alive[0].hpPercent) : 100,
  };
}
