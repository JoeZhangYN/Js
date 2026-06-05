// 浮动配置按钮（hvAAButton）。chunk1 整合（去独立浮动，统一入口）：
// hv-utils 顶部栏（#hvut-top，_top.init 副作用 import 先于本函数执行）存在时——其齿轮槽位即 HVAA 面板入口——
// 不再建独立浮动按钮；hv-utils 缺席（顶部栏未渲染 / 非 HV 页）时浮动按钮作 fallback 主入口。
// onclick 收口到 render.js 的 openHVAAConfig 单一入口（与齿轮槽位共用 window.HVAA_openConfig 桥）。
import { gE, cE } from "../dom/query.js";
import { openHVAAConfig } from "./render.js";

export function optionButton(lang) {
  if (gE("#hvut-top")) return; // hv-utils 顶部栏(齿轮槽位=HVAA 入口)已存在 → 不重复建浮动按钮
  const optionButton = gE("body").appendChild(cE("div"));
  optionButton.className = "hvAAButton";
  optionButton.onclick = () => openHVAAConfig(lang);
}
