// SHELL: 调 decideCastDebuffOnAll 拿 ActionResult → 翻译为 DOM 副作用。
import { gE } from "../../dom/query.js";
import { g, tagEndToTrue } from "../../state/store.js";
import { _alert } from "../../core/lang.js";
import { checkAndActivateSpirit } from "../buff.js";
import { pauseChange } from "../main-loop.js";
import { decideCastDebuffOnAll } from "./decide-cast-all.js";

/**
 * castDebuffOnAll 的 SHELL 适配器。
 * @param {string} debuffKey
 * @param {import("../../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传，必传；collectSnapshot 已含 spellAoe）
 */
export function executeCastDebuffOnAll(debuffKey, snap) {
  const result = decideCastDebuffOnAll(g("option"), snap, debuffKey);

  if (result.kind === "noop") return;
  if (result.kind === "alert-and-pause") {
    _alert(0, result.msg.l0, result.msg.l1, result.msg.l2);
    pauseChange();
    tagEndToTrue();
    return;
  }
  if (result.kind === "click-skill-then-target") {
    if (checkAndActivateSpirit()) return;
    const skillEl = gE(result.skillSel);
    if (!skillEl) return;
    skillEl.click();
    const targetEl = gE(result.targetSel);
    if (targetEl) targetEl.click();
    tagEndToTrue();
  }
}
