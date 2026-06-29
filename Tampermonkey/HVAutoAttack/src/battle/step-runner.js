// 主循环步骤执行器（Phase 5b 编排倒置 + 深度 B 全 PURE）。
// runRules：遍历 BattleRule[]，PURE decide → dispatch(SHELL) → acted 短路。
// 旧 runSteps（g("end") 中断 flag）+ delegate 过渡桥均已拆除（拆桥）；主循环停止信号
// 现由 dispatch 返 acted 驱动（某 rule 触发副作用即短路后续），不再有全局 end flag。
import { dispatch } from "./dispatch.js";

/**
 * Phase 5b 编排倒置主循环：遍历 BattleRule[]，decide(PURE) → dispatch(SHELL)。
 * 某 rule 的 dispatch 返 acted=true（已触发副作用）即停止后续。
 * @param {import("../core/types.js").BattleRule[]} rules
 * @param {import("../core/types.js").BattleSnapshot} snap
 * @param {object} opt
 */
export function runRules(rules, snap, opt) {
  for (const rule of rules) {
    if (dispatch(rule.decide(snap, opt), snap)) return;
  }
}
