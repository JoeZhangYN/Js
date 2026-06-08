// 唯一 SHELL（Phase 5b 编排倒置）：把 PURE decide 的 ActionResult 翻译为 DOM 副作用。
// 复用 attempt-click / navigate / lang / pause-control / activate-spirit 现有工具，收敛原先
// 散在 execute-buff / execute-cast-all / useDeSkill 各自内联的 dispatch 重复（应抽尽抽）。
//
// 返回 acted(boolean)：runRules 据此短路（取代 g("end") 主循环 flag，commit 5 拆桥）。
// 现阶段 attemptClick* / pauseScript / delegate.run 内部仍调 tagEndToTrue，与现存 runSteps
// 的 g("end") 机制并存，直到 main-loop 切 runRules。
import { gE } from "../dom/query.js";
import { attemptClick, attemptClickWithTarget } from "../dom/attempt-click.js";
import { g, tagEndToTrue } from "../state/store.js";
import { scheduleReload, openUrl } from "../core/navigate.js";
import { _alert } from "../core/lang.js";
import { pauseScript } from "./pause-control.js";
import { checkAndActivateSpirit } from "./buff/activate-spirit.js";

/**
 * 执行一个 ActionResult，返回是否已触发副作用。
 * @param {import("../core/types.js").ActionResult} result
 * @returns {boolean} acted —— 已触发副作用（主循环据此停止后续 rule）
 */
export function dispatch(result) {
  switch (result.kind) {
    case "noop":
      return false;

    case "click":
      // attemptClick 内含 isOn 探活 + click + tagEnd，失败（按钮禁用/缺失）返 false 不设 end
      return attemptClick(result.selector);

    case "click-skill-then-target":
      // debuff 双段：Spirit 前置（命中则本回合让出）再 skill→target 双击。
      // 收编原 execute-cast-all / useDeSkill 重复的 checkAndActivateSpirit 短路。
      if (checkAndActivateSpirit()) return true;
      return attemptClickWithTarget(result.skillSel, result.targetSel);

    case "click-then-reload": {
      // flee：逃跑按钮 click + 延时 reload（逃跑按钮恒可点，无需 isOn 探活）
      const el = gE(result.selector);
      if (!el) return false;
      el.click();
      scheduleReload(result.delaySec);
      tagEndToTrue();
      return true;
    }

    case "alert-and-pause":
      _alert(0, result.msg.l0, result.msg.l1, result.msg.l2);
      pauseScript(); // setValue disabled + 按钮文案 + tagEnd
      return true;

    case "navigate":
      // 当前无 step 消费者，保留以备 future（reloader 等）。
      openUrl(result.url);
      tagEndToTrue();
      return true;

    case "halt":
      return true;

    case "delegate": {
      // 过渡桥：复杂 step（循环/fallback 链）暂用现有 execute（内部自带 click + tagEnd）。
      // 读 g("end") 作 acted 后 reset —— g("end") 退化为 delegate 内部局部信号。
      // TODO 拆桥: delegate 内部 PURE 化后删此分支 + 内部 tagEnd。
      result.run();
      const acted = !!g("end");
      if (acted) g("end", false);
      return acted;
    }

    default:
      return false;
  }
}
