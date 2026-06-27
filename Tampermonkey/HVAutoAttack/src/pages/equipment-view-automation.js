// 装备查看页增强编排入口：init 只上报页面类型，不拼 option/DOM 门控。
import { isOptionOn, getOption } from "../state/option.js";
import { PageKind } from "./page-kind.js";
import { runEquipPercentileEnhancement } from "./equip-percentile-dispatcher.js";
import { runForgeCostEnhancement } from "./showequip-forge-cost.js";

const EVENT_PAGE_READY = "pageReady";

export const EquipmentViewEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

function makeDeps(deps) {
  return {
    getOption: deps.getOption || getOption,
    isOptionOn: deps.isOptionOn || isOptionOn,
    runEquipPercentileEnhancement:
      deps.runEquipPercentileEnhancement || runEquipPercentileEnhancement,
    runForgeCostEnhancement: deps.runForgeCostEnhancement || runForgeCostEnhancement,
  };
}

function shouldRunForgeCost(kind, deps) {
  return kind === PageKind.SHOWEQUIP && deps.isOptionOn("forgeCostShow");
}

function shouldRunEquipPercentile(deps) {
  const mode = deps.getOption("equipPercentileMode", "off");
  return mode && mode !== "off";
}

export function runEquipmentViewAutomation(
  event = { type: EVENT_PAGE_READY },
  deps = {}
) {
  if (event.type !== EVENT_PAGE_READY) return false;
  const runtime = makeDeps(deps);
  const { kind } = event;
  let ran = false;
  if (shouldRunForgeCost(kind, runtime)) {
    runtime.runForgeCostEnhancement();
    ran = true;
  }
  if (shouldRunEquipPercentile(runtime)) {
    runtime.runEquipPercentileEnhancement();
    ran = true;
  }
  return ran;
}
