// 主循环步骤执行器（Phase 5b 编排倒置 + 深度 B 全 PURE）。
// runRules：遍历 BattleRule[]，when 门控 → PURE decide → dispatch(SHELL) → acted 短路。
// 旧 runSteps（g("end") flag）+ delegate 过渡桥均已拆除（拆桥）；判断全在 PURE decide，
// dispatch 只翻译数据→副作用并返 acted。g("end") 仅由 tagEnd 写、无人读（遗留，留待统一清理）。
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
    if (dispatch(rule.decide(snap, opt), snap)) return;
  }
}
