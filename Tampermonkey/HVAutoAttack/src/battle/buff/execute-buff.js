// SHELL: 调 decideBuff 拿 ActionResult → 交统一 dispatch 执行。
// Phase 5b-3：dispatch 已从此处内联抽到 battle/dispatch.js（应抽尽抽）。
import { g } from "../../state/store.js";
import { decideBuff } from "./decide-buff.js";
import { dispatch } from "../dispatch.js";

/**
 * useBuffSkill 的 SHELL 适配器。
 * @param {import("../../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传，必传）
 */
export function executeBuffSkill(snap) {
  dispatch(decideBuff(g("option"), snap));
}
