// Debuff 系统：可施放性判断 + 单目标 / AoE 全员施放。
// Phase 5b-2 wave 1：castDebuffOnAll 已切 PURE decide-cast-all + SHELL execute-cast-all。
// useDeSkill 待 Phase 5b-3 wave 2。
import { gE } from "../dom/query.js";
import { g, tagEndToTrue } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { checkAndActivateSpirit } from "./buff.js";
import { pauseScript } from "./pause-control.js";
import { executeCastDebuffOnAll } from "./debuff/execute-cast-all.js";
import { decideDeSkill } from "./debuff/decide-de-skill.js";

// 旧 DOM 版 canApplyDebuff 已删除（Phase 5b 后零调用者）：
// 判定逻辑迁至 PURE 版 debuff/can-apply.js::canApplyDebuffPure（decide-cast-all / decide-de-skill 共享）。

/** @param {import("../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传；已含 spellAoe） */
export function useDeSkill(snap) {
  // Phase 5b-3 wave 2：委托给 PURE decide-de-skill + SHELL adapter
  const result = decideDeSkill(g("option"), snap);
  if (result.kind === "noop") return;
  if (result.kind === "alert-and-pause") {
    _alert(0, result.msg.l0, result.msg.l1, result.msg.l2);
    pauseScript();
    tagEndToTrue();
    return;
  }
  if (result.kind === "click-skill-then-target") {
    if (checkAndActivateSpirit()) return;
    const skillEl = gE(result.skillSel);
    if (!skillEl) return;
    skillEl.click();
    const tgt = gE(result.targetSel);
    if (tgt) tgt.click();
    tagEndToTrue();
  }
}

/**
 * 全员 debuff 施放（Phase 5b-2 wave 1：委托给 PURE decide-cast-all + SHELL execute-cast-all）。
 * 入口签名不变。
 */
/** @param {string} debuffKey @param {import("../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传） */
export function castDebuffOnAll(debuffKey, snap) {
  executeCastDebuffOnAll(debuffKey, snap);
  // 末尾排序复位（保留以兼容 attack.js 等的 monsterStatus.sort 假设）
  g("monsterStatus").sort((a, b) => a.finWeight - b.finWeight);
}
