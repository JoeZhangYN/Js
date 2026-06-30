// PURE: attack 6 分支优先级决策入口。
// **不读 DOM**：只读 event facts（含统一怪物视图 event.monsterFacts）。
import { bigSkillCodes } from "../big-skill-catalog.js";
import { decideAttackPlan } from "./attack-plan.js";

const EVENT_DECIDE_PLAN = "decidePlan";
const EVENT_WILL_CLEAR_WITH_BIG_SKILL = "willClearWithBigSkill";

export const AttackDecisionEvent = Object.freeze({
  DECIDE_PLAN: EVENT_DECIDE_PLAN,
  WILL_CLEAR_WITH_BIG_SKILL: EVENT_WILL_CLEAR_WITH_BIG_SKILL,
});

const attackDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE_PLAN]: (event) => ({
    kind: "attack-plan",
    plan: decideAttackPlan(event.opt || {}, event),
  }),
  [EVENT_WILL_CLEAR_WITH_BIG_SKILL]: (event) => willClearWithBigSkill(event),
});

const ATTACK_PLAN_CLEAR_PREDICATES = Object.freeze({
  physical: (plan) => bigSkillCodes().includes(plan.code),
});

/**
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult} { kind:"attack-plan", plan }
 */
export function decideAttack(event = {}) {
  return (attackDecisionEventHandlers[event.type] || attackDecisionEventHandlers[EVENT_DECIDE_PLAN])(
    event
  );
}

function willClearWithBigSkill(event) {
  const plan = decideAttackPlan(event.opt || {}, event);
  return attackPlanWillClearWithBigSkill(plan);
}

function attackPlanWillClearWithBigSkill(plan) {
  return ATTACK_PLAN_CLEAR_PREDICATES[plan?.type]?.(plan) ?? false;
}
