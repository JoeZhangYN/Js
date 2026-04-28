// 主循环步骤执行器。把 main() 里 11 段 `if(g("end")) return` 收敛成一个循环。
// Phase 5 chunk A 阶段：兼容老的 g("end") flag。Chunk B 会引入 ActionResult discriminated union。
import { g } from "../state/store.js";

/**
 * 顺序执行 steps，任一 step 设置 g("end")=true 即停止后续。
 * @param {Array<() => void>} steps
 */
export function runSteps(steps) {
  g("end", false);
  for (const step of steps) {
    step();
    if (g("end")) return;
  }
}
