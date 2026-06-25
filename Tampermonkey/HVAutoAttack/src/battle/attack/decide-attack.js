// PURE: attack 6 分支优先级决策（focus / spirit 切换 / spell+AoE / merciful 斩杀 / physical-utility / 默认攻击）。
// **不读 DOM**：只读 snap（含统一怪物视图 snap.view：finWeight/hpAbsNow/hpMax/buffs/order）+ g() runtime。
// 目标选择走 target-strategy 具名策略：firstByFinWeight=默认首怪(综合权重最优) / firstByOrder=AoE 锚(order 最小)。
import { g } from "../../state/store.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { selectSpellTier } from "./decide-tier.js";
import { scorePhysicalSkillCandidates } from "./decide-skill.js";
import { pickByUtility } from "../utility-engine.js";
import { OFFENSIVE_SPELL_LIB } from "../../data/spell-lib.js";
import { isStallMode } from "../potion-economy.js";
import { aliveByOrder } from "../monster-view.js";
import { firstByFinWeight, firstByOrder } from "../target-strategy.js";
import { pickBestElement } from "./pick-element.js";

/** merciful blow 斩杀 HP 比例阈值（原 attack.js 字面量 0.248）。 */
const MERCIFUL_HP = 0.248;

/**
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap 含 snap.view 统一怪物视图（finWeight/hpAbsNow/hpMax/buffs）
 * @returns {import("../../core/types.js").ActionResult} { kind:"attack-plan", plan }
 */
export function decideAttack(opt, snap) {
  return { kind: "attack-plan", plan: decidePlan(opt, snap) };
}

/** @returns {import("../../core/types.js").AttackPlan} */
function decidePlan(opt, snap) {
  const alive = aliveByOrder(snap.view);
  const firstMonster = firstByFinWeight(alive); // finWeight 最小 = 默认攻击目标
  const buffsOf = (id) => snap.view.find((m) => m.id === id)?.buffs || [];

  // 1. 专注
  if (opt.focus && checkCondition(opt.focusCondition, snap)) {
    return { type: "focus" };
  }

  // 2. 灵动架势切换：stall 跳过 + both-active 冲突跳过 + hysteresis 防抖
  const stallNow = isStallMode(snap, opt, g("roundNow"), g("roundAll"));
  const lastToggle = g("lastSpiritToggleGlobalTurn") ?? -999;
  const curGlobalTurn = snap.globalTurn || 0;
  const cooldown = opt.spiritToggleMinInterval ?? 3;
  const onCond = opt.turnOnSS && checkCondition(opt.turnOnSSCondition, snap);
  const offCond = opt.turnOffSS && checkCondition(opt.turnOffSSCondition, snap);
  const wantsOn = onCond && !snap.spiritOn;
  const wantsOff = offCond && snap.spiritOn;
  const bothActive = onCond && offCond;
  if (!stallNow && !bothActive && curGlobalTurn - lastToggle >= cooldown && (wantsOn || wantsOff)) {
    return { type: "toggle-spirit" };
  }

  // 3. ether-tap gate：命中则跳过法术阶（fall through 到物理/默认）
  const etherTapGate =
    opt.etherTap &&
    !!firstMonster &&
    buffsOf(firstMonster.id).includes("coalescemana") &&
    (!snap.etherTapActiveX2 || snap.etherTapExpiring) &&
    checkCondition(opt.etherTapCondition, snap);

  // 4. 法术阶（snap.skillReady 替代 isOn；未 ready → fall through）。
  //    autoElement(默认关)：按首怪九抗选最弱属性覆盖 attackStatus；缺 resists/未配 → 回退 snap.attackStatus(零变化)。
  const autoEl =
    opt.autoElement && firstMonster ? pickBestElement(firstMonster, opt).element : null;
  const atkStatus = autoEl ?? snap.attackStatus;
  if (!etherTapGate && atkStatus !== 0 && firstMonster) {
    // tier 选择也用覆盖后的属性（基于该属性的 skillReady），保持 tier↔spellId 一致
    const snapForTier = autoEl ? { ...snap, attackStatus: atkStatus } : snap;
    const { tier } = selectSpellTier(opt, snapForTier);
    if (tier > 0) {
      const spellId = `1${atkStatus}${tier}`;
      if (snap.skillReady[spellId]) {
        const spellKey = `${atkStatus}${tier}`;
        const spellName = OFFENSIVE_SPELL_LIB.get(spellKey);
        const aoeCount = spellName
          ? snap.spellAoe[spellName] || (opt.spellAoe && opt.spellAoe[spellKey]) || 1
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
      g("roundNow") === g("roundAll")
    ) {
      const t = firstMonster;
      const skillId = `2${opt.fightingStyle}03`;
      if (
        t.hpAbsNow / t.hpMax < MERCIFUL_HP &&
        buffsOf(t.id).includes("wpn_bleed") &&
        snap.oc >= 105 &&
        snap.skillReady[skillId]
      ) {
        return { type: "merciful-single", skillId, targetId: t.id };
      }
    }

    // utility scoring 选物理技能（PURE 候选 + 纯选择）
    const scored = scorePhysicalSkillCandidates(opt, snap, {
      firstMonsterStunned: !!firstStunned,
    });
    const winner = pickByUtility(scored);
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
