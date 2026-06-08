// SHELL: 调 decideCastDebuffOnAll 拿 ActionResult → 交统一 dispatch 执行。
// Spirit 前置 / alert-and-pause / 双击均由 dispatch 统一处理（原内联逻辑已收敛进 battle/dispatch.js）。
import { g } from "../../state/store.js";
import { decideCastDebuffOnAll } from "./decide-cast-all.js";
import { dispatch } from "../dispatch.js";

/**
 * castDebuffOnAll 的 SHELL 适配器。
 * @param {string} debuffKey
 * @param {import("../../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传；含 spellAoe）
 */
export function executeCastDebuffOnAll(debuffKey, snap) {
  dispatch(decideCastDebuffOnAll(g("option"), snap, debuffKey));
}
