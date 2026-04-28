// 核心类型定义（JSDoc）。Phase 5 ActionResult discriminated union 替代 g("end") 中断 flag。
// 这文件 export {} 让它成为 ES module；类型仅 IDE 提示用。

/**
 * 决策结果。纯决策函数返此类型，shell 翻译为副作用。
 *
 * @typedef {{ kind: "noop" }
 *         | { kind: "click", selector: string }
 *         | { kind: "click-skill-then-target", skillSel: string, targetSel: string }
 *         | { kind: "halt", reason: "victory"|"defeat"|"flee"|"pause"|"acted" }
 *         | { kind: "alert-and-pause", msg: { l0: string, l1: string, l2: string } }
 *         | { kind: "navigate", url: string, delayMs?: number }
 *         } ActionResult
 */

/** 攻击模式枚举（Phase 6 OFC/FRD CD tracking 会扩展）。 */
/** @typedef {"OFC"|"FRD"} BigPhysicalSkill */

/**
 * 怪物事实快照（Phase 5b-1）。**plain object，不含 DOM 引用**。
 * @typedef {object} MonsterFacts
 * @property {number} id          mkey_${id} 用
 * @property {number} order       列表位置 0-9
 * @property {boolean} isDead
 * @property {boolean} isBoss     HV 用 .btm2 的 style.background 标识 boss
 * @property {number} hpRatio     0..1
 * @property {string[]} buffs     img name 列表（如 "weaken", "wpn_stun", "wpn_bleed"）
 * @property {Array<{img:string,turns:number}>=} buffEffects 含剩余回合的版本
 */

/** 全 23 技能 CD map：code → turnsUntilReady（0=可用）。 @typedef {Record<string, number>} CdMap */

/**
 * 战斗快照（Phase 5b-1）。**生命周期仅当前 turn**。
 * @typedef {object} BattleSnapshot
 * @property {number} turn         per-battle 计数
 * @property {number} globalTurn   跨 battle 累计
 * @property {number} hp           0..100
 * @property {number} mp
 * @property {number} sp
 * @property {number} oc
 * @property {boolean} channeling
 * @property {boolean} spiritOn
 * @property {MonsterFacts[]} monsters
 * @property {number} aliveCount
 * @property {string[]} playerBuffs              img name 列表
 * @property {Record<string,number>} playerEffectTurns  img → 剩余回合（Infinity = 永续）
 * @property {CdMap} cdMap
 * @property {number} attackStatus
 * @property {string} fightingStyle
 */

export {};
