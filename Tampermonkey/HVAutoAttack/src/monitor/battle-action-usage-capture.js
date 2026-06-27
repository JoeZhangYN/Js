// 战斗动作使用采集：动作开始读取用户动作意图，动作结束绑定战斗日志。
import { gE } from "../dom/query.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

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
    unsafeWindow: deps.unsafeWindow || unsafeWindow,
  };
}

function readActionUsage(deps) {
  if (!deps.readOptionField("recordUsage", false)) {
    pendingUsage = undefined;
    return undefined;
  }

  const action = deps.unsafeWindow.info;
  pendingUsage = { mode: action.mode };
  if (action.mode === "items") {
    const itemEl = deps.gE(`#pane_item div[id^="ikey"][onclick*="skill('${action.skill}')"]`);
    pendingUsage.item = itemEl ? itemEl.textContent : action.skill;
  } else if (action.mode === "magic") {
    const magicEl = deps.gE(action.skill);
    pendingUsage.magic = magicEl ? magicEl.textContent : action.skill;
    const onmouseover = magicEl ? magicEl.getAttribute("onmouseover") : null;
    const cost = onmouseover ? onmouseover.match(/\('.*', '.*', '.*', (\d+), (\d+), \d+\)/) : null;
    pendingUsage.mp = cost ? cost[1] * 1 : 0;
    pendingUsage.oc = cost ? cost[2] * 1 : 0;
  }
  return pendingUsage;
}

function completeActionUsage(deps) {
  if (!deps.readOptionField("recordUsage", false) || !pendingUsage) return undefined;

  const usage = { ...pendingUsage, log: deps.gE("#textlog>tbody>tr>td", "all") };
  pendingUsage = undefined;
  return usage;
}

export function runBattleActionUsageCapture(event, deps) {
  const runtime = runtimeDeps(deps);
  if (event.type === EVENT_ACTION_STARTED) return readActionUsage(runtime);
  if (event.type === EVENT_ACTION_ENDED) return completeActionUsage(runtime);
  return undefined;
}
