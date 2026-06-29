// 装备查看页增强编排入口：init 只上报页面类型，不拼 option/DOM 门控。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { PageKind } from "./page-kind.js";
import { runEquipPercentileEnhancement } from "./equip-percentile-dispatcher.js";
import { runForgeCostEnhancement } from "./showequip-forge-cost.js";

const EVENT_PAGE_READY = "pageReady";

export const EquipmentViewEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

function makeDeps(deps) {
  return {
    readOptionField:
      deps.readOptionField ||
      ((key, fallback) => runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback })),
    readOptionEnabled:
      deps.readOptionEnabled || ((key) => runOptionAutomation({ type: OptionEvent.IS_ON, key })),
    runEquipPercentileEnhancement:
      deps.runEquipPercentileEnhancement || runEquipPercentileEnhancement,
    runForgeCostEnhancement: deps.runForgeCostEnhancement || runForgeCostEnhancement,
  };
}

function shouldRunForgeCost(kind, deps) {
  return kind === PageKind.SHOWEQUIP && deps.readOptionEnabled("forgeCostShow");
}

function readEquipPercentileMode(deps) {
  const mode = deps.readOptionField("equipPercentileMode", "off");
  return mode || "off";
}

export function runEquipmentViewAutomation(event = { type: EVENT_PAGE_READY }, deps = {}) {
  if (event.type !== EVENT_PAGE_READY) return false;
  const runtime = makeDeps(deps);
  const { kind } = event;
  let ran = false;
  if (shouldRunForgeCost(kind, runtime)) {
    runtime.runForgeCostEnhancement();
    ran = true;
  }
  const equipPercentileMode = readEquipPercentileMode(runtime);
  if (equipPercentileMode !== "off") {
    runtime.runEquipPercentileEnhancement(equipPercentileMode);
    ran = true;
  }
  return ran;
}
