// 核心类型定义（JSDoc）。ActionResult discriminated union 承载 PURE decide 的决策结果，dispatch 翻译为副作用。
// 这文件 export {} 让它成为 ES module；类型仅 IDE 提示用。

/**
 * 决策结果。纯决策函数返此类型，dispatch（battle/dispatch.js）翻译为副作用。
 *
 * - click-skill-then-target: dispatch 含 **Spirit Stance 前置**（checkAndActivateSpirit 命中则本回合让出），
 *   收编 debuff 全员/单目标 + boss-imperil 的统一双段语义。
 * - flee-command: flee 专用 command——click 逃跑按钮后 scheduleReload。
 * - pause / critical-pause: 纯暂停 / 关键 buff 即将消失告警暂停。
 * - *-plan: attack/item/channel 多分支决策的数据计划，由对应 execute-*（execute-attack/item/channel）
 *   执行——保持通用 dispatch 不被各 step 细节污染。深度 B 后已无 delegate 过渡桥。
 *
 * @typedef {{ kind: "noop" }
 *         | { kind: "skill-command", skillId: string }
 *         | { kind: "item-command", itemId: string|number }
 *         | { kind: "defend-command" }
 *         | { kind: "toggle-spirit" }
 *         | { kind: "click-skill-then-target", skillId: string, targetId: number }
 *         | { kind: "flee-command" }
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

/**
 * 统一怪物视图（business capability）。把"怪物"业务实体散落的 3 个面 join 成单一画像：
 * snap.monsters(DOM 实时态) + monsterStatus(HP 绝对值/权重) + monster-db(九抗/身份)。
 * 所有 decide 的目标选择从此视图派生(battle/target-strategy.js)，不再各自裸读散落字段。
 * **血量三概念显式区分**：hpPercent(百分比) / hpAbsNow(绝对当前) / hpMax(绝对满血)。
 * **三个 id 概念显式区分**：`id`=战场槽位 mkey(0-9，点击用) / `monsterId`=全局 MID(库主键) /
 * `level`=本场战斗等级 LV(决定 maxHP；≠ 固有 powerLevel/plvl)。
 * @typedef {object} UnifiedMonster
 * @property {number} id            mkey_${id} 点击用（战场槽位 0-9，非全局身份）
 * @property {number} order         战场列表位 0..9（snap↔monsterStatus 的 join key）
 * @property {number=} monsterId    全局怪物 MID（开局 spawn 行；抗性/maxHP 库主键，区别槽位 id）
 * @property {number=} level        本场战斗等级 LV（spawn 行；决定 maxHP；≠ 固有 powerLevel）
 * @property {string} name          怪名(.btm3；显示用，库查询改用 monsterId)
 * @property {boolean} isDead
 * @property {boolean} isBoss       身份维度：boss(.btm2 background)
 * @property {string=} monsterClass 身份维度：怪物类别(monster-db)
 * @property {number=} powerLevel   身份维度：固有 PowerLevel(monster-db plvl；系统怪 0；≠ 战斗 level)
 * @property {string=} attackType   怪物攻击类型(monster-db)
 * @property {string[]} buffs       debuff img name 列表
 * @property {Array<{img:string,turns:number}>=} buffEffects 含剩余回合
 * @property {number} hpPercent     血条百分比 0..1（来自 snap.monsters.hpRatio）
 * @property {number} hpAbsNow      当前绝对血（来自 monsterStatus.hpNow = hpMax×血条%）
 * @property {number} hpMax         满血绝对值（来自 monsterStatus.hp；日志 HP= 解析）
 * @property {number=} inferredMaxHP #491 死亡反推满血
 * @property {number} finWeight     攻击权重（升序首怪；来自 monsterStatus）
 * @property {{fire:number,cold:number,elec:number,wind:number,holy:number,dark:number,crushing:number,slashing:number,piercing:number}=} resists 九抗(+抗/-弱；monster-db，缺=undefined)
 * @property {number=} dbMaxHP      monster-db 持久反推满血
 */

/**
 * 开局 spawn 行解析的单怪条目（log-parser.parseMonsterRoster）。
 * @typedef {object} MonsterRosterEntry
 * @property {number=} monsterId 全局 MID（spawn 行 `MID=`）
 * @property {string=} name      怪名（spawn 行 `(<name>)`）
 * @property {number=} level     本场战斗 LV（spawn 行 `LV=`；决定 maxHP）
 * @property {number|null} maxHP 满血绝对值（spawn 行 `HP=`；null=该位未解析到 → 占位）
 */

/**
 * monsterStatus 单条（g("monsterStatus")；buildMonsterStatus 产出 → monster-status-hp 每 turn 补 isDead/hpNow/finWeight）。
 * **三 id 概念**：`id`=槽位 mkey(0-9) / `monsterId`=全局 MID / `level`=战斗 LV（见 UnifiedMonster）。
 * @typedef {object} MonsterStatus
 * @property {number} order        战场列表位 0..9（snap join key）
 * @property {number} id           战场槽位 mkey(0-9)，点击用
 * @property {number=} monsterId   全局 MID（spawn 行；持久跨 turn，供库 join + 占位兜底）
 * @property {string=} name        怪名（spawn 行）
 * @property {number=} level       本场战斗 LV（spawn 行）
 * @property {number} hp           满血绝对值（maxHP；占位时 = fallbackHp）
 * @property {boolean=} hpInferred true=hp 为占位（开局未解析到），applyInferredMaxHp 据此判定兜底
 * @property {boolean=} isDead     monster-status-hp 补
 * @property {number=} hpNow       当前绝对血（monster-status-hp 补 = hp×血条%）
 * @property {number=} finWeight   攻击权重（monster-status-hp 补）
 * @property {number=} inferredMaxHP 死亡反推满血（Step4 升级公式）
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
 * @property {UnifiedMonster[]} view             统一怪物视图(snap+monsterStatus+db join)；目标选择/派生量从此派生
 * @property {number} aliveCount
 * @property {number} soloMonsterHpPercent       仅 1 怪存活时该怪血条%（0..100），否则 100；非门"濒死守卫"用
 * @property {number} lowestMonsterHpPercent     存活怪里最低血条%（0..100），无存活则 100
 * @property {number} firstMonsterHpPercent      order 最小存活怪血条%（0..100），无存活则 100
 * @property {string[]} playerBuffs              img name 列表
 * @property {Record<string,number>} playerEffectTurns  img → 剩余回合（Infinity = 永续）
 * @property {boolean=} etherTapActiveX2         玩家有 "Ether Tap (x2)" 效果（attack ether-tap gate 用）
 * @property {boolean=} etherTapExpiring         wpn_et 效果即将过期（effect_expire id）
 * @property {Array<{img:string,name:string,turns:number}>=} playerEffects 玩家效果明细（channel/critical 用）
 * @property {(string|null)=} gemName            宝石按钮文案（#ikey_p textContent，decideGem 用）
 * @property {CdMap} cdMap
 * @property {number} attackStatus
 */

export {};
