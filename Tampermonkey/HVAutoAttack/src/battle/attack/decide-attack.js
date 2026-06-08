// PURE: attack 6 分支优先级决策（focus / spirit 切换 / spell+AoE / merciful 斩杀 / physical-utility / 默认攻击）。
// **不读 DOM**：只读 snap（spiritOn/skillReady/oc/spellAoe/attackStatus/globalTurn/monsters[].buffs/etherTap*）
// + monsterStatus（g 内存态，finWeight 升序，hpNow/hp/id/order）+ g() runtime（roundNow/roundAll/lastSpiritToggle）。
// 所有原 isOn(x) 改吃 snap.skillReady[x]（attack 是末 rule，turn 入口快照 == 当前 DOM）。
import { g } from "../../state/store.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { selectSpellTier } from "./decide-tier.js";
import { scorePhysicalSkillCandidates } from "./decide-skill.js";
import { pickByUtility } from "../utility-engine.js";
import { OFFENSIVE_SPELL_LIB } from "../../data/spell-lib.js";
import { isStallMode } from "../potion-economy.js";

/** merciful blow 斩杀 HP 比例阈值（原 attack.js 字面量 0.248）。 */
const MERCIFUL_HP = 0.248;

/**
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @param {Array<{id:number,order:number,isDead:boolean,hpNow:number,hp:number}>} monsterStatus
 *   g("monsterStatus")：finWeight 升序内存态（countMonsterHP 已填），非 DOM。
 * @returns {import("../../core/types.js").ActionResult} { kind:"attack-plan", plan }
 */
export function decideAttack(opt, snap, monsterStatus) {
  return { kind: "attack-plan", plan: decidePlan(opt, snap, monsterStatus) };
}

/** @returns {import("../../core/types.js").AttackPlan} */
function decidePlan(opt, snap, monsterStatus) {
  const aliveMonsters = (monsterStatus || []).filter((m) => !m.isDead);
  const firstMonster = aliveMonsters[0]; // finWeight 最小 = 默认攻击目标
  // 怪物 buff 来自 snap.monsters（DOM 序），按 id 对应 monsterStatus
  const buffsOf = (id) => snap.monsters.find((m) => m.id === id)?.buffs || [];

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
  if (
    !stallNow &&
    !bothActive &&
    curGlobalTurn - lastToggle >= cooldown &&
    (wantsOn || wantsOff)
  ) {
    return { type: "toggle-spirit" };
  }

  // 3. ether-tap gate：命中则跳过法术阶（fall through 到物理/默认）
  const etherTapGate =
    opt.etherTap &&
    !!firstMonster &&
    buffsOf(firstMonster.id).includes("coalescemana") &&
    (!snap.etherTapActiveX2 || snap.etherTapExpiring) &&
    checkCondition(opt.etherTapCondition, snap);

  // 4. 法术阶（snap.skillReady 替代 isOn；未 ready → fall through）
  if (!etherTapGate && snap.attackStatus !== 0 && firstMonster) {
    const { tier } = selectSpellTier(opt, snap);
    if (tier > 0) {
      const spellId = `1${snap.attackStatus}${tier}`;
      if (snap.skillReady[spellId]) {
        const spellKey = `${snap.attackStatus}${tier}`;
        const spellName = OFFENSIVE_SPELL_LIB.get(spellKey);
        const aoeCount = spellName
          ? snap.spellAoe[spellName] || (opt.spellAoe && opt.spellAoe[spellKey]) || 1
          : 1;
        if (aoeCount >= 2 && aliveMonsters.length > 1) {
          const byOrder = [...aliveMonsters].sort((a, b) => a.order - b.order);
          return { type: "spell", spellId, targetId: byOrder[0].id }; // AoE：order 最小
        }
        return { type: "spell", spellId, targetId: firstMonster.id }; // 单目标：默认首怪
      }
      // spell on CD → fall through to physical/default
    }
  }

  // 5. 物理技能
  if (opt.skillSwitch && firstMonster) {
    const firstStunned =
      opt.fightingStyle === "2" && buffsOf(firstMonster.id).includes("wpn_stun");

    // merciful single：最后一回合仅剩一怪，斩杀流血残血（skill ready 才提交，否则落 utility）
    if (
      opt.mercifulBlow &&
      opt.fightingStyle === "2" &&
      aliveMonsters.length === 1 &&
      g("roundNow") === g("roundAll")
    ) {
      const t = firstMonster;
      const skillId = `2${opt.fightingStyle}03`;
      if (
        t.hpNow / t.hp < MERCIFUL_HP &&
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
      if (opt.mercifulBlow && opt.fightingStyle === "2" && winner.code === "T3" && aliveMonsters.length > 1) {
        const m = aliveMonsters.find(
          (x) => x.hpNow / x.hp < MERCIFUL_HP && buffsOf(x.id).includes("wpn_bleed")
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
