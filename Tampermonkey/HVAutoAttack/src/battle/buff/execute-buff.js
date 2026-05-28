// SHELL: 调 decideBuff 拿 ActionResult → 翻译为 DOM click 副作用。
// 现阶段 dispatch 内联在此（待 Phase 5b-3 后统一抽到 battle/dispatch.js）。
import { gE } from "../../dom/query.js";
import { g, tagEndToTrue } from "../../state/store.js";
import { decideBuff } from "./decide-buff.js";

/**
 * useBuffSkill 的 SHELL 适配器。
 * @param {import("../../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传，必传）
 */
export function executeBuffSkill(snap) {
  const result = decideBuff(g("option"), snap);
  if (result.kind === "noop") return;
  if (result.kind === "click") {
    const el = gE(result.selector);
    if (el) {
      el.click();
      tagEndToTrue();
    }
  }
}
