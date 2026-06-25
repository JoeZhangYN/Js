// 核心类型定义（JSDoc）。ActionResult discriminated union 承载 PURE decide 的决策结果，dispatch 翻译为副作用。
// 这文件 export {} 让它成为 ES module；类型仅 IDE 提示用。

/**
 * 决策结果。纯决策函数返此类型，dispatch（battle/dispatch.js）翻译为副作用。
 *
 * - click-skill-then-target: dispatch 含 **Spirit Stance 前置**（checkAndActivateSpirit 命中则本回合让出），
 *   收编 debuff 全员/单目标 + boss-imperil 的统一双段语义。
 * - click-then-reload: flee 专用——click 逃跑按钮后 scheduleReload。
 * - pause / critical-pause: 纯暂停 / 关键 buff 即将消失告警暂停。
 * - *-plan: attack/item/channel 多分支决策的数据计划，由对应 execute-*（execute-attack/item/channel）
 *   执行——保持通用 dispatch 不被各 step 细节污染。深度 B 后已无 delegate 过渡桥。
 *
 * @typedef {{ kind: "noop" }
 *         | { kind: "click", selector: string }
 *         | { kind: "click-skill-then-target", skillSel: string, targetSel: string }
 *         | { kind: "click-then-reload", selector: string, delaySec: number }
 *         | { kind: "halt", reason: "victory"|"defeat"|"flee"|"pause"|"acted" }
 *         | { kind: "alert-and-pause", msg: { l0: string, l1: string, l2: string } }
 *         | { kind: "pause" }
 *         | { kind: "critical-pause", name: string, turns: number, mp: number, mpFloor: number }
 *         | { kind: "attack-plan", plan: AttackPlan }
 *         | { kind: "item-plan", plan: ItemPlan }
 *         | { kind: "channel-plan", plan: ChannelPlan }
 *         } ActionResult
 */

/**
 * 物品 step 决策计划（decideGemUse/decidePotion/decideStallTopup/decideScroll → executeItem）。
 * @typedef {{ type:"noop" }
 *         | { type:"gem" }
 *         | { type:"potion", candidates: string[], noWaste: boolean }
 *         | { type:"stall", attempts: Array<{kind:"spirit-off"}|{kind:"focus"}|{kind:"draught", id:number}> }
 *         | { type:"scroll", candidates: number[] }
 *         } ItemPlan
 */

/**
 * Channel step 决策计划（decideChannel → executeChannel）。三段优先级返单 click 或 noop。
 * @typedef {{ type:"click", skillId:string } | { type:"noop" }} ChannelPlan
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
 * @property {number} soloMonsterHp              仅 1 怪存活时该怪 HP%（0..100），否则 100；非门"濒死守卫"用
 * @property {number} lowestMonsterHp            存活怪里最低 HP%（0..100），无存活则 100
 * @property {number} firstMonsterHp             order 最小存活怪 HP%（0..100），无存活则 100
 * @property {string[]} playerBuffs              img name 列表
 * @property {Record<string,number>} playerEffectTurns  img → 剩余回合（Infinity = 永续）
 * @property {boolean=} etherTapActiveX2         玩家有 "Ether Tap (x2)" 效果（attack ether-tap gate 用）
 * @property {boolean=} etherTapExpiring         wpn_et 效果即将过期（effect_expire id）
 * @property {Array<{img:string,name:string,turns:number}>=} playerEffects 玩家效果明细（channel/critical 用）
 * @property {(string|null)=} gemName            宝石按钮文案（#ikey_p textContent，decideGem 用）
 * @property {CdMap} cdMap
 * @property {number} attackStatus
 * @property {string} fightingStyle
 */

export {};
