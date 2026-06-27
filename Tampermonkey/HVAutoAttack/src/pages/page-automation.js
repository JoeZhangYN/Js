// 页面自动化编排入口：init 只上报页面类型，本入口决定具体页面能力顺序。
import { scheduleReload } from "../core/navigate.js";
import { g } from "../state/store.js";
import { PageRefreshEvent, runPageRefreshAutomation } from "../alarm/page-refresh.js";
import { AppStartupEvent, runAppStartup } from "./app-startup.js";
import { runCrossSiteEncounterNavigation } from "./cross-site-encounter-navigation.js";
import { runEquipmentViewAutomation } from "./equipment-view-automation.js";
import { runRiddleAutomation } from "./riddle-automation.js";
import { runLobbyAutomation } from "./lobby-automation.js";
import { runBattleAutomation } from "../battle/battle-automation.js";
import { PageKind } from "./page-kind.js";

function isGameAutomationPage(kind) {
  return kind === PageKind.RIDDLE || kind === PageKind.BATTLE || kind === PageKind.LOBBY;
}

function scheduleUnknownPageReload(kind) {
  if (isGameAutomationPage(kind)) return false;
  scheduleReload(5 * 60);
  return true;
}

function runGamePageAutomation(kind) {
  if (!runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })) return;
  runPageRefreshAutomation({
    type: PageRefreshEvent.GAME_PAGE_READY,
    option: g("option"),
  });
  if (kind === PageKind.RIDDLE) {
    runRiddleAutomation();
  } else if (kind === PageKind.BATTLE) {
    runBattleAutomation();
  } else {
    runLobbyAutomation();
  }
}

export function runPageAutomation(kind) {
  runEquipmentViewAutomation(kind);
  if (runCrossSiteEncounterNavigation(kind)) return;
  if (scheduleUnknownPageReload(kind)) return;
  runGamePageAutomation(kind);
}
