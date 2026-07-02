// 维修决策（PURE）：吃 (opt, state, repairedIds) 返 RepairPlan。无 DOM / 无 IO / 无 g()。
//
// 职责仅三件：① 判定哪些件需修（两世界判据不同，见 needsRepair）② 止损（修过仍坏不再重复）
// ③ 选一件修 + 带回其需求材料。**买不买料、料够不够、信用点上限——不在此决定**：持有量/价格只在
// material-shop 端口（商店页）可知，买料策略由 orchestrator + 端口承担，保持本层纯可测（铁律 2b 机械/AI 归位）。
//
// 止损（保留旧 repair-check.js「同件修后仍坏→停机」不变量并适配端口）：repairedIds 在单次 runRepair
// 会话内累积（orchestrator 每次提交修理 push 目标 id，会话内不清）。当所有「需修件」都已修过仍坏
// （broken ⊆ repairedIds）→ stop-stuck，避免「带坏装备继续打→坏得更多→再修又失败」死循环。
// 逐件推进：优先选未修过的件，使多件场景能依次修完而非卡在第一件（优于旧版「首件==lastID 即停」）。

/** @typedef {import("./parse-repair-state.js").RepairState} RepairState */
/** @typedef {import("./parse-repair-state.js").RepairMaterial} RepairMaterial */
/**
 * @typedef {{ action: "proceed" }
 *   | { action: "stop-stuck", stuckIds: string[] }
 *   | { action: "repair", repairIds: string[], materials: RepairMaterial[] }} RepairPlan
 */

const EVENT_PLAN = "plan";

export const RepairDecisionEvent = Object.freeze({
  PLAN: EVENT_PLAN,
});

const repairDecisionEventHandlers = Object.freeze({
  [EVENT_PLAN]: (event) => decideRepair(event.option, event.state, event.repairedIds),
});

/**
 * 单件是否需修：主世界(conditionPct 数值) → 耐久 ≤ 阈值；异世界(conditionPct=null) → 有需求材料即需修
 * （异世界维修页只列需修件，满修件无 .m，见 parse）。
 * @param {RepairState["equips"][number]} eq
 * @param {number} threshold repairValue
 */
function needsRepair(eq, threshold) {
  if (eq.conditionPct !== null && eq.conditionPct !== undefined) {
    return eq.conditionPct <= threshold;
  }
  return eq.materials.length > 0;
}

/**
 * @param {{ repairValue?: number }} opt repair orchestration option subset
 * @param {RepairState} state
 * @param {string[]} repairedIds 本会话已提交修理的装备 id（止损态）
 * @returns {RepairPlan}
 */
function decideRepair(opt, state, repairedIds) {
  const threshold = Number(opt?.repairValue) || 0;
  const done = repairedIds || [];
  const broken = (state?.equips || []).filter((eq) => needsRepair(eq, threshold));

  if (broken.length === 0) return { action: "proceed" };

  // 所有需修件都已修过仍坏 → 修不动，止损停机。
  if (broken.every((eq) => done.includes(eq.id))) {
    return { action: "stop-stuck", stuckIds: broken.map((eq) => eq.id) };
  }

  // 逐件推进：优先未修过的件（让多件依次修完）；全修过则不会到此（上面已 stuck）。
  const target = broken.find((eq) => !done.includes(eq.id)) || broken[0];
  return {
    action: "repair",
    repairIds: [target.id],
    materials: target.materials,
  };
}

export function runRepairDecision(event) {
  return repairDecisionEventHandlers[event?.type]?.(event);
}
