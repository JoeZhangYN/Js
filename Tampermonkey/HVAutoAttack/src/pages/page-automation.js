// 页面自动化编排入口：init 只上报页面类型，本入口决定具体页面能力顺序。
import { g } from "../state/store.js";
import { PageRefreshEvent, runPageRefreshAutomation } from "../alarm/page-refresh.js";
import { AppStartupEvent, runAppStartup } from "./app-startup.js";
import {
  CrossSiteEncounterEvent,
  runCrossSiteEncounterNavigation,
} from "./cross-site-encounter-navigation.js";
import {
  EquipmentViewEvent,
  runEquipmentViewAutomation,
} from "./equipment-view-automation.js";
import { runRiddleAutomation } from "./riddle-automation.js";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";
import { runBattleAutomation } from "../battle/battle-automation.js";
import { PageKind } from "./page-kind.js";

const EVENT_PAGE_READY = "pageReady";

export const PageAutomationEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

function isGameAutomationPage(kind) {
  return kind === PageKind.RIDDLE || kind === PageKind.BATTLE || kind === PageKind.LOBBY;
}

function scheduleUnknownPageReload(kind) {
  if (isGameAutomationPage(kind)) return false;
  return runPageRefreshAutomation({ type: PageRefreshEvent.UNKNOWN_PAGE_READY });
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
    runLobbyAutomation({ type: LobbyEvent.PAGE_READY });
  }
}

export function runPageAutomation(event = { type: EVENT_PAGE_READY }) {
  if (event.type !== EVENT_PAGE_READY) return undefined;
  const { kind } = event;
  runEquipmentViewAutomation({ type: EquipmentViewEvent.PAGE_READY, kind });
  if (
    runCrossSiteEncounterNavigation({
      type: CrossSiteEncounterEvent.PAGE_READY,
      kind,
    })
  ) {
    return;
  }
  if (scheduleUnknownPageReload(kind)) return;
  runGamePageAutomation(kind);
}
