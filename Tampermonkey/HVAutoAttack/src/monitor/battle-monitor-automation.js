// 战斗监控编排入口：HUD、使用统计、掉落记录统一从这里进入。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { refreshBattleHud } from "./battle-info.js";
import { recordBattleDrops } from "./drop-monitor.js";
import { recordCompletedBattleUsage, recordUsage } from "./record-usage.js";
import {
  clearDropReport,
  clearUsageReport,
  recordBattleReportStarted,
  readDropReport,
  readUsageReport,
} from "./battle-report.js";

const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_HUD_REFRESH = "hudRefresh";
const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_COMPLETION_REACHED = "completionReached";
const EVENT_READ_DROP_REPORT = "readDropReport";
const EVENT_READ_USAGE_REPORT = "readUsageReport";
const EVENT_CLEAR_DROP_REPORT = "clearDropReport";
const EVENT_CLEAR_USAGE_REPORT = "clearUsageReport";

export const BattleMonitorEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  HUD_REFRESH: EVENT_HUD_REFRESH,
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
  READ_DROP_REPORT: EVENT_READ_DROP_REPORT,
  READ_USAGE_REPORT: EVENT_READ_USAGE_REPORT,
  CLEAR_DROP_REPORT: EVENT_CLEAR_DROP_REPORT,
  CLEAR_USAGE_REPORT: EVENT_CLEAR_USAGE_REPORT,
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
    const itemEl = gE(`#pane_item div[id^="ikey"][onclick*="skill('${action.skill}')"]`);
    pendingUsage.item = itemEl ? itemEl.textContent : action.skill;
  } else if (action.mode === "magic") {
    const magicEl = gE(action.skill);
    pendingUsage.magic = magicEl ? magicEl.textContent : action.skill;
    const onmouseover = magicEl ? magicEl.getAttribute("onmouseover") : null;
    const cost = onmouseover ? onmouseover.match(/\('.*', '.*', '.*', (\d+), (\d+), \d+\)/) : null;
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
  if (g("option").dropMonitor) recordBattleDrops(battleLog);
  if (g("option").recordUsage) recordCompletedBattleUsage();
}

function recordBattleStarted() {
  recordBattleReportStarted({
    recordEach: g("option").recordEach,
    roundType: g("roundType"),
    roundAll: g("roundAll"),
    recordLabel: time(1),
  });
}

export function runBattleMonitorAutomation(event = { type: EVENT_HUD_REFRESH }) {
  if (event.type === EVENT_BATTLE_STARTED) {
    recordBattleStarted();
  } else if (event.type === EVENT_HUD_REFRESH) {
    refreshBattleHud();
  } else if (event.type === EVENT_ACTION_STARTED) {
    readActionUsage();
  } else if (event.type === EVENT_ACTION_ENDED) {
    recordActionEnd();
  } else if (event.type === EVENT_COMPLETION_REACHED) {
    recordCompletion();
  } else if (event.type === EVENT_READ_DROP_REPORT) {
    return readDropReport();
  } else if (event.type === EVENT_READ_USAGE_REPORT) {
    return readUsageReport();
  } else if (event.type === EVENT_CLEAR_DROP_REPORT) {
    clearDropReport();
  } else if (event.type === EVENT_CLEAR_USAGE_REPORT) {
    clearUsageReport();
  }
  return undefined;
}
