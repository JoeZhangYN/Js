// PURE: attack 6 分支优先级决策（focus / spirit 切换 / spell+AoE / merciful 斩杀 / physical-utility / 默认攻击）。
// **不读 DOM**：只读 event facts（含统一怪物视图 event.monsterFacts：finWeight/hpAbsNow/hpMax/buffs/order）。
// 目标选择走 target-strategy 具名策略：firstByFinWeight=默认首怪(综合权重最优) / firstByOrder=AoE 锚(order 最小)。
import { checkCondition } from "../../settings/condition-eval.js";
import { scorePhysicalSkillCandidates } from "./physical-skill-scoring.js";
import { pickByUtility } from "./physical-skill-ranking.js";
import { OFFENSIVE_SPELL_LIB } from "../../data/spell-lib.js";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "../battle-stall-mode.js";
import { bigSkillCodes } from "../big-skill-catalog.js";
import { aliveByOrder } from "../monster-view.js";
import { firstByFinWeight, firstByOrder } from "../target-strategy.js";
import { selectAutoElement } from "./auto-element-selection.js";

/** merciful blow 斩杀 HP 比例阈值（原 attack.js 字面量 0.248）。 */
const MERCIFUL_HP = 0.248;
const EVENT_DECIDE_PLAN = "decidePlan";
const EVENT_WILL_CLEAR_WITH_BIG_SKILL = "willClearWithBigSkill";

export const AttackDecisionEvent = Object.freeze({
  DECIDE_PLAN: EVENT_DECIDE_PLAN,
  WILL_CLEAR_WITH_BIG_SKILL: EVENT_WILL_CLEAR_WITH_BIG_SKILL,
});

const attackDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE_PLAN]: (event) => ({ kind: "attack-plan", plan: decidePlan(event.opt || {}, event) }),
  [EVENT_WILL_CLEAR_WITH_BIG_SKILL]: (event) => willClearWithBigSkill(event),
});

function selectSpellTier(opt, event) {
  const attackStatus = event.attackStatus;
  if (attackStatus === 0 || attackStatus == null) return { tier: 0 };

  const channelLock = opt.channelForceHighTier !== false && event.channeling;
  const downgrade =
    !channelLock &&
    opt.spellTierDowngrade !== false &&
    event.aliveCount <= (opt.spellDowngradeThreshold || 3);

  const id1 = `1${attackStatus}1`;
  const id2 = `1${attackStatus}2`;
  const id3 = `1${attackStatus}3`;
  const ready1 = !!event.skillReady?.[id1];
  const ready2 = !!event.skillReady?.[id2];
  const ready3 = !!event.skillReady?.[id3];

  if (downgrade) return { tier: ready1 ? 1 : 0 };

  const highMet = channelLock || checkCondition(opt.highSkillCondition, event.conditionFacts);
  const midMet = channelLock || checkCondition(opt.middleSkillCondition, event.conditionFacts);
  if (highMet && ready3) return { tier: 3 };
  if (midMet && ready2) return { tier: 2 };
  if (ready1) return { tier: 1 };
  return { tier: 0 };
}

/**
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult} { kind:"attack-plan", plan }
 */
export function decideAttack(event = {}) {
  return (attackDecisionEventHandlers[event.type] || attackDecisionEventHandlers[EVENT_DECIDE_PLAN])(event);
}

function willClearWithBigSkill(event) {
  const plan = decidePlan(event.opt || {}, event);
  return plan.type === "physical" && bigSkillCodes().includes(plan.code);
}

/** @returns {import("../../core/types.js").AttackPlan} */
function decidePlan(opt, event) {
  const alive = aliveByOrder(event.monsterFacts);
  const firstMonster = firstByFinWeight(alive); // finWeight 最小 = 默认攻击目标
  const buffsOf = (id) => (event.monsterFacts || []).find((m) => m.id === id)?.buffs || [];

  // 1. 专注
  if (opt.focus && checkCondition(opt.focusCondition, event.conditionFacts)) {
    return { type: "focus" };
  }

  // 2. 灵动架势切换：stall 跳过 + both-active 冲突跳过 + hysteresis 防抖
  const stallNow = runBattleStallModeAutomation({
    type: BattleStallModeEvent.READ_ACTIVE,
    opt,
    roundNow: event?.roundNow,
    roundAll: event?.roundAll,
    monsterFacts: event?.monsterFacts,
    overcharge: event?.overcharge,
  });
  const lastToggle = event.lastSpiritToggleGlobalTurn ?? -999;
  const curGlobalTurn = event.globalTurn || 0;
  const cooldown = opt.spiritToggleMinInterval ?? 3;
  const onCond = opt.turnOnSS && checkCondition(opt.turnOnSSCondition, event.conditionFacts);
  const offCond = opt.turnOffSS && checkCondition(opt.turnOffSSCondition, event.conditionFacts);
  const wantsOn = onCond && !event.spiritOn;
  const wantsOff = offCond && event.spiritOn;
  const bothActive = onCond && offCond;
  if (!stallNow && !bothActive && curGlobalTurn - lastToggle >= cooldown && (wantsOn || wantsOff)) {
    return { type: "toggle-spirit" };
  }

  // 3. ether-tap gate：命中则跳过法术阶（fall through 到物理/默认）
  const etherTapGate =
    opt.etherTap &&
    !!firstMonster &&
    buffsOf(firstMonster.id).includes("coalescemana") &&
    (!event.etherTapActiveX2 || event.etherTapExpiring) &&
    checkCondition(opt.etherTapCondition, event.conditionFacts);

  // 4. 法术阶（snap.skillReady 替代 isOn；未 ready → fall through）。
  //    autoElement(默认关)：按首怪九抗选最弱属性覆盖 attackStatus；缺 resists/未配 → 回退 snap.attackStatus(零变化)。
  const autoEl =
    opt.autoElement && firstMonster ? selectAutoElement(firstMonster, opt).element : null;
  const atkStatus = autoEl ?? event.attackStatus;
  if (!etherTapGate && atkStatus !== 0 && firstMonster) {
    // tier 选择也用覆盖后的属性（基于该属性的 skillReady），保持 tier↔spellId 一致
    const eventForTier = autoEl ? { ...event, attackStatus: atkStatus } : event;
    const { tier } = selectSpellTier(opt, eventForTier);
    if (tier > 0) {
      const spellId = `1${atkStatus}${tier}`;
      if (event.skillReady?.[spellId]) {
        const spellKey = `${atkStatus}${tier}`;
        const spellName = OFFENSIVE_SPELL_LIB.get(spellKey);
        const aoeCount = spellName
          ? event.spellAoe?.[spellName] || (opt.spellAoe && opt.spellAoe[spellKey]) || 1
          : 1;
        if (aoeCount >= 2 && alive.length > 1) {
          return { type: "spell", spellId, targetId: firstByOrder(alive).id }; // AoE：order 最小
        }
        return { type: "spell", spellId, targetId: firstMonster.id }; // 单目标：默认首怪
      }
      // spell on CD → fall through to physical/default
    }
  }

  // 5. 物理技能
  if (opt.skillSwitch && firstMonster) {
    const firstStunned = opt.fightingStyle === "2" && buffsOf(firstMonster.id).includes("wpn_stun");

    // merciful single：最后一回合仅剩一怪，斩杀流血残血（skill ready 才提交，否则落 utility）
    if (
      opt.mercifulBlow &&
      opt.fightingStyle === "2" &&
      alive.length === 1 &&
      event.roundNow === event.roundAll
    ) {
      const t = firstMonster;
      const skillId = `2${opt.fightingStyle}03`;
      if (
        t.hpAbsNow / t.hpMax < MERCIFUL_HP &&
        buffsOf(t.id).includes("wpn_bleed") &&
        event.overcharge >= 105 &&
        event.skillReady?.[skillId]
      ) {
        return { type: "merciful-single", skillId, targetId: t.id };
      }
    }

    // utility scoring 选物理技能（PURE 候选 + 纯选择）
    const scored = scorePhysicalSkillCandidates(opt, event, {
      firstMonsterStunned: !!firstStunned,
    });
    const winner = pickByUtility(scored, { debugLog: !!opt.dynamicHealLog });
    if (winner) {
      // T3 多怪 merciful AoE：斩杀第一个流血残血怪（原 attack 只点首个就 return）
      let mercifulTargetId = null;
      if (
        opt.mercifulBlow &&
        opt.fightingStyle === "2" &&
        winner.code === "T3" &&
        alive.length > 1
      ) {
        const m = alive.find(
          (x) => x.hpAbsNow / x.hpMax < MERCIFUL_HP && buffsOf(x.id).includes("wpn_bleed")
        );
        mercifulTargetId = m ? m.id : null;
      }
      // 物理技能后恒点首怪（原 attack.js 末尾默认 mkey click 在 decideByUtility 后必执行）
      return {
        type: "physical",
        skillId: winner.id,
        code: winner.code,
        defaultTargetId: firstMonster.id,
        mercifulTargetId,
      };
    }
  }

  // 6. 默认攻击首怪
  if (firstMonster) return { type: "default", targetId: firstMonster.id };
  return { type: "noop" };
}
