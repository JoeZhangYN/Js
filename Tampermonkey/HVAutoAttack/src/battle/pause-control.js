// 暂停脚本控制（叶子模块）。
// 把"设 disabled + 切按钮文案 + tagEnd"从 main-loop.pauseChange 的 else 分支提取出来，
// 供 debuff / execute-cast-all 等 SHELL 触发暂停时复用，断开它们对 main-loop 的循环依赖
// （原 main-loop ↔ debuff ↔ execute-cast-all 环）。
// 注：完整的"继续→重启 main()"切换仍在 main-loop.pauseChange（暂停/继续按钮 click 用）。
import { gE } from "../dom/query.js";
import { setValue } from "../state/storage.js";
import { tagEndToTrue } from "../state/store.js";

/** 暂停脚本（不含"继续"逻辑）：与 main-loop.pauseChange 的 else 分支逐字等价。 */
export function pauseScript() {
  if (gE(".pauseChange")) {
    gE(".pauseChange").innerHTML = "<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>";
  }
  setValue("disabled", true);
  tagEndToTrue();
}
