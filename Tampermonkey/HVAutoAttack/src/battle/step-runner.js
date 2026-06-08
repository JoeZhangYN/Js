// 主循环步骤执行器（Phase 5b 编排倒置）。
// runRules：遍历 BattleRule[]，when 门控 → PURE decide → dispatch(SHELL) → acted 短路。
// 旧 runSteps（g("end") flag 命令式短路）已随 main-loop 切 runRules 拆除（拆桥）；
// g("end") 仅剩 dispatch 的 delegate 分支作局部 acted 信号（过渡桥，后续 chunk 消除）。
import { g } from "../state/store.js";
import { dispatch } from "./dispatch.js";

/**
 * Phase 5b 编排倒置主循环：遍历 BattleRule[]，when 门控 → decide(PURE) → dispatch(SHELL)。
 * 某 rule 的 dispatch 返 acted=true（已触发副作用）即停止后续。
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
