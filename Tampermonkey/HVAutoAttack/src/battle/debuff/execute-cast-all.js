// SHELL: 调 decideCastDebuffOnAll 拿 ActionResult → 翻译为 DOM 副作用。
import { gE } from "../../dom/query.js";
import { g, tagEndToTrue } from "../../state/store.js";
import { _alert } from "../../core/lang.js";
import { collectSnapshot } from "../snapshot.js";
import { checkAndActivateSpirit } from "../buff.js";
import { pauseChange } from "../main-loop.js";
import { decideCastDebuffOnAll } from "./decide-cast-all.js";

/**
 * castDebuffOnAll 的 SHELL 适配器。
 * @param {string} debuffKey
 * @param {import("../../core/types.js").BattleSnapshot=} snap 可选
 */
export function executeCastDebuffOnAll(debuffKey, snap) {
  const s = snap || collectSnapshot();
  // snap 默认无 spellAoe 字段，临时注入（Phase 5b-3 移到 collectSnapshot 内）
  if (!s.spellAoe) s.spellAoe = g("spellAoe") || {};
  const result = decideCastDebuffOnAll(g("option"), s, debuffKey);

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
