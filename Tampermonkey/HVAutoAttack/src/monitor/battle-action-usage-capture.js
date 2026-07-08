// 战斗动作使用采集：动作开始读取用户动作意图，动作结束绑定战斗日志。
import { gE } from "../dom/query.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { recordBattleActionUsageCaptureFailure } from "./battle-action-usage-capture-failure.js";

const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";

export const BattleActionUsageCaptureEvent = Object.freeze({
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
});

let pendingUsage;

function runtimeDeps(deps = {}) {
  return {
    gE: deps.gE || gE,
    readOptionField:
      deps.readOptionField ||
      ((key, fallback) => runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback })),
    unsafeWindow: deps.unsafeWindow || globalThis.unsafeWindow,
  };
}

function failureError(error) {
  return error?.message || String(error);
}

function readRecordUsageEnabled(deps, stage) {
  try {
    return deps.readOptionField("recordUsage", false);
  } catch (error) {
    recordBattleActionUsageCaptureFailure(stage, {
      reason: "optionReadFailed",
      error: failureError(error),
    });
    return false;
  }
}

function queryUsageElement(deps, stage, selector, mode) {
  try {
    return deps.gE(selector, mode);
  } catch (error) {
    recordBattleActionUsageCaptureFailure(stage, { selector, error: failureError(error) });
    return mode === "all" ? [] : null;
  }
}

function readActionUsage(deps) {
  if (!readRecordUsageEnabled(deps, "action-start-option")) {
    pendingUsage = undefined;
    return undefined;
  }

  const action = deps.unsafeWindow?.info;
  if (!action?.mode) {
    pendingUsage = undefined;
    recordBattleActionUsageCaptureFailure("action-start-info", { reason: "missingActionInfo" });
    return undefined;
  }
  pendingUsage = { mode: action.mode };
  if (action.mode === "items") {
    const itemEl = queryUsageElement(
      deps,
      "action-start-item",
      `#pane_item div[id^="ikey"][onclick*="skill('${action.skill}')"]`
    );
    pendingUsage.item = itemEl ? itemEl.textContent : action.skill;
  } else if (action.mode === "magic") {
    const magicEl = queryUsageElement(deps, "action-start-magic", action.skill);
    pendingUsage.magic = magicEl ? magicEl.textContent : action.skill;
    const onmouseover = magicEl ? magicEl.getAttribute("onmouseover") : null;
    const cost = onmouseover ? onmouseover.match(/\('.*', '.*', '.*', (\d+), (\d+), \d+\)/) : null;
    pendingUsage.mp = cost ? cost[1] * 1 : 0;
    pendingUsage.oc = cost ? cost[2] * 1 : 0;
  }
  return pendingUsage;
}

function completeActionUsage(deps) {
  if (!readRecordUsageEnabled(deps, "action-end-option") || !pendingUsage) return undefined;

  const usage = {
    ...pendingUsage,
    log: queryUsageElement(deps, "action-end-log", "#textlog>tbody>tr>td", "all"),
  };
  pendingUsage = undefined;
  return usage;
}

const actionUsageCaptureHandlers = Object.freeze({
  [EVENT_ACTION_STARTED]: (_event, runtime) => readActionUsage(runtime),
  [EVENT_ACTION_ENDED]: (_event, runtime) => completeActionUsage(runtime),
});

export function runBattleActionUsageCapture(event, deps) {
  const handler = actionUsageCaptureHandlers[event?.type];
  if (!handler) return undefined;
  const runtime = runtimeDeps(deps);
  return handler(event, runtime);
}
