// 战斗监控编排入口：HUD、使用统计、掉落记录统一从这里进入。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { battleInfo } from "./battle-info.js";
import { dropMonitor } from "./drop-monitor.js";
import { recordUsage, recordUsage2 } from "./record-usage.js";

const EVENT_HUD_REFRESH = "hudRefresh";
const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_COMPLETION_REACHED = "completionReached";

export const BattleMonitorEvent = Object.freeze({
  HUD_REFRESH: EVENT_HUD_REFRESH,
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
});

let pendingUsage;

function readActionUsage() {
  if (!g("option").recordUsage) {
    pendingUsage = undefined;
    return;
  }
  const action = unsafeWindow.info;
  pendingUsage = { mode: action.mode };
  if (action.mode === "items") {
    const itemEl = gE(
      `#pane_item div[id^="ikey"][onclick*="skill('${action.skill}')"]`
    );
    pendingUsage.item = itemEl ? itemEl.textContent : action.skill;
  } else if (action.mode === "magic") {
    const magicEl = gE(action.skill);
    pendingUsage.magic = magicEl ? magicEl.textContent : action.skill;
    const onmouseover = magicEl ? magicEl.getAttribute("onmouseover") : null;
    const cost = onmouseover
      ? onmouseover.match(/\('.*', '.*', '.*', (\d+), (\d+), \d+\)/)
      : null;
    pendingUsage.mp = cost ? cost[1] * 1 : 0;
    pendingUsage.oc = cost ? cost[2] * 1 : 0;
  }
}

function recordActionEnd() {
  if (!g("option").recordUsage || !pendingUsage) return;
  pendingUsage.log = gE("#textlog>tbody>tr>td", "all");
  recordUsage(pendingUsage);
}

function recordCompletion() {
  const battleLog = gE("#textlog>tbody>tr>td", "all");
  if (g("option").dropMonitor) dropMonitor(battleLog);
  if (g("option").recordUsage) recordUsage2();
}

export function runBattleMonitorAutomation(event = { type: EVENT_HUD_REFRESH }) {
  if (event.type === EVENT_HUD_REFRESH) {
    battleInfo();
  } else if (event.type === EVENT_ACTION_STARTED) {
    readActionUsage();
  } else if (event.type === EVENT_ACTION_ENDED) {
    recordActionEnd();
  } else if (event.type === EVENT_COMPLETION_REACHED) {
    recordCompletion();
  }
}
