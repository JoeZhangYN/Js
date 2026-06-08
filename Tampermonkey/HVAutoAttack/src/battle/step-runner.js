// 主循环步骤执行器。
// runSteps：旧命令式路径（g("end") flag 短路），commit 5 拆桥后删除。
// runRules：Phase 5b 编排倒置路径——遍历 BattleRule[]，PURE decide → dispatch → acted 短路。
import { g } from "../state/store.js";
import { dispatch } from "./dispatch.js";

/**
 * 顺序执行 steps，任一 step 设置 g("end")=true 即停止后续。
 * @deprecated Phase 5b 编排倒置后由 runRules 取代；commit 5 删除。
 * @param {Array<() => void>} steps
 */
export function runSteps(steps) {
  g("end", false);
  for (const step of steps) {
    step();
    if (g("end")) return;
  }
}

/**
 * Phase 5b 编排倒置主循环：遍历 BattleRule[]，when 门控 → decide(PURE) → dispatch(SHELL)。
 * 某 rule 的 dispatch 返 acted=true（已触发副作用）即停止后续——取代 runSteps 的 g("end") flag。
 * @param {import("../core/types.js").BattleRule[]} rules
 * @param {import("../core/types.js").BattleSnapshot} snap
 * @param {object} opt
 */
export function runRules(rules, snap, opt) {
  g("end", false);
  for (const rule of rules) {
    if (rule.when && !rule.when(snap, opt)) continue;
    if (dispatch(rule.decide(snap, opt))) return;
  }
}
