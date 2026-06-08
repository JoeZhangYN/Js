// 核心类型定义（JSDoc）。Phase 5 ActionResult discriminated union 替代 g("end") 中断 flag。
// 这文件 export {} 让它成为 ES module；类型仅 IDE 提示用。

/**
 * 决策结果。纯决策函数返此类型，dispatch（battle/dispatch.js）翻译为副作用。
 *
 * - click-skill-then-target: dispatch 实现含 **Spirit Stance 前置**（checkAndActivateSpirit
 *   命中则本回合让出），收编 debuff 全员/单目标的统一双段语义。
 * - click-then-reload: flee 专用——click 逃跑按钮后 scheduleReload。
 * - delegate: **过渡桥**（Phase 5b 编排倒置）。复杂 step（循环/fallback 链）暂以 run() 包现有
 *   execute，dispatch 调 run 后读 g("end") 作 acted。@deprecated 后续 chunk PURE 化后删。
 *
 * @typedef {{ kind: "noop" }
 *         | { kind: "click", selector: string }
 *         | { kind: "click-skill-then-target", skillSel: string, targetSel: string }
 *         | { kind: "click-then-reload", selector: string, delaySec: number }
 *         | { kind: "halt", reason: "victory"|"defeat"|"flee"|"pause"|"acted" }
 *         | { kind: "alert-and-pause", msg: { l0: string, l1: string, l2: string } }
 *         | { kind: "navigate", url: string, delayMs?: number }
 *         | { kind: "delegate", name: string, run: () => void }
 *         | { kind: "attack-plan", plan: AttackPlan }
 *         } ActionResult
 */

/**
 * attack 决策计划（decideAttack PURE 产出，executeAttack SHELL 执行）。attack 专属，由
 * ActionResult 的 "attack-plan" kind 承载——避免 attack 的多分支细节污染通用 dispatch/ActionResult。
 * - spell: 单目标 targetId=首怪(finWeight 最小)；AoE targetId=order 最小存活怪。
 * - physical: 恒带 defaultTargetId(原 attack 物理技能后必点首怪)；mercifulTargetId = T3 多怪场景
 *   第一个流血残血怪(可空)。
 * @typedef {{ type:"noop" }
 *         | { type:"focus" }
 *         | { type:"toggle-spirit" }
 *         | { type:"spell", spellId:string, targetId:number }
 *         | { type:"merciful-single", skillId:string, targetId:number }
 *         | { type:"physical", skillId:string, code:string, defaultTargetId:number, mercifulTargetId?:(number|null) }
 *         | { type:"default", targetId:number }
 *         } AttackPlan
 */

/**
 * 主循环决策规则（Phase 5b 编排倒置）。main-loop 只依赖 BattleRule[] + ActionResult 两个抽象，
 * 不再 import 具体 execute 实现。decide 纯函数返 ActionResult 交 dispatch 执行。
 * @typedef {object} BattleRule
 * @property {string} name                                           日志/调试用
 * @property {(snap: BattleSnapshot, opt: object) => boolean} [when]  可选前置门控；省略=总是 decide
 * @property {(snap: BattleSnapshot, opt: object) => ActionResult} decide PURE 决策
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
 * @property {boolean=} etherTapActiveX2         玩家有 "Ether Tap (x2)" 效果（attack ether-tap gate 用）
 * @property {boolean=} etherTapExpiring         wpn_et 效果即将过期（effect_expire id）
 * @property {CdMap} cdMap
 * @property {number} attackStatus
 * @property {string} fightingStyle
 */

export {};
