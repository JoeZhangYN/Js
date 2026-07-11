// 装备分析文档运行期入口：动态 surface 生命周期与静态 showequip 页面能力在此组合。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { PageKind } from "./page-kind.js";
import { runEquipPercentileEnhancement } from "./equip-percentile-dispatcher.js";
import { runForgeCostEnhancement } from "./showequip-forge-cost.js";

const EVENT_DOCUMENT_STARTED = "documentStarted";

export const EquipmentViewEvent = Object.freeze({
  DOCUMENT_STARTED: EVENT_DOCUMENT_STARTED,
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

export function runEquipmentViewAutomation(event = { type: EVENT_DOCUMENT_STARTED }, deps = {}) {
  if (event?.type !== EVENT_DOCUMENT_STARTED) return false;
  const runtime = makeDeps(deps);
  const { pageKind } = event;
  let ran = false;
  if (shouldRunForgeCost(pageKind, runtime)) {
    runtime.runForgeCostEnhancement();
    ran = true;
  }
  const equipPercentileMode = readEquipPercentileMode(runtime);
  runtime.runEquipPercentileEnhancement(equipPercentileMode);
  if (equipPercentileMode !== "off") ran = true;
  return ran;
}
