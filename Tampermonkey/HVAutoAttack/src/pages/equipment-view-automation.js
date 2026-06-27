// 装备查看页增强编排入口：init 只上报页面类型，不拼 option/DOM 门控。
import { isOptionOn, getOption } from "../state/option.js";
import { PageKind } from "./page-kind.js";
import { setupEquipPercentile } from "./equip-percentile-dispatcher.js";
import { setupForgeCost } from "./showequip-forge-cost.js";

function shouldRunForgeCost(kind) {
  return kind === PageKind.SHOWEQUIP && isOptionOn("forgeCostShow");
}

function shouldRunEquipPercentile() {
  const mode = getOption("equipPercentileMode", "off");
  return mode && mode !== "off";
}

export function runEquipmentViewAutomation(kind) {
  if (shouldRunForgeCost(kind)) setupForgeCost();
  if (shouldRunEquipPercentile()) setupEquipPercentile();
}
