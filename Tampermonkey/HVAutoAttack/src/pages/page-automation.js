// 页面自动化编排入口：init 只上报页面类型，本入口决定具体页面能力顺序。
import { PageRefreshEvent, runPageRefreshAutomation } from "../alarm/page-refresh.js";
import { AppStartupEvent, runAppStartup } from "./app-startup.js";
import {
  CrossSiteEncounterEvent,
  runCrossSiteEncounterNavigation,
} from "./cross-site-encounter-navigation.js";
import { EquipmentViewEvent, runEquipmentViewAutomation } from "./equipment-view-automation.js";
import { runRiddleAutomation } from "./riddle-automation.js";
import { LobbyEvent, runLobbyAutomation } from "./lobby-automation.js";
import { BattleEvent, runBattleAutomation } from "../battle/battle-automation.js";
import { PageKind } from "./page-kind.js";

const EVENT_PAGE_READY = "pageReady";

export const PageAutomationEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

const pageAutomationEventHandlers = Object.freeze({
  [EVENT_PAGE_READY]: (event) => runPageReadyFlow({ kind: event.kind }),
});

const GAME_PAGE_AUTOMATION = Object.freeze({
  [PageKind.RIDDLE]: runRiddlePageAutomation,
  [PageKind.BATTLE]: runBattlePageAutomation,
  [PageKind.LOBBY]: runLobbyPageAutomation,
});

const PAGE_READY_FLOW_STEPS = [
  reportEquipmentViewPageReady,
  handleCrossSiteEncounterPageReady,
  handleUnknownPageReady,
  runGamePageReadyAutomation,
];

function isGameAutomationPage(kind) {
  return Boolean(GAME_PAGE_AUTOMATION[kind]);
}

function scheduleUnknownPageReload(kind) {
  if (isGameAutomationPage(kind)) return false;
  return runPageRefreshAutomation({ type: PageRefreshEvent.UNKNOWN_PAGE_READY });
}

function runRiddlePageAutomation() {
  runRiddleAutomation();
}

function runBattlePageAutomation() {
  runBattleAutomation({ type: BattleEvent.PAGE_READY });
}

function runLobbyPageAutomation() {
  runLobbyAutomation({ type: LobbyEvent.PAGE_READY });
}

function runGamePageAutomation(kind) {
  if (!runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })) return;
  runPageRefreshAutomation({ type: PageRefreshEvent.GAME_PAGE_READY });
  GAME_PAGE_AUTOMATION[kind]?.();
}

function reportEquipmentViewPageReady(context) {
  runEquipmentViewAutomation({ type: EquipmentViewEvent.PAGE_READY, kind: context.kind });
  return false;
}

function handleCrossSiteEncounterPageReady(context) {
  return runCrossSiteEncounterNavigation({
    type: CrossSiteEncounterEvent.PAGE_READY,
    kind: context.kind,
  });
}

function handleUnknownPageReady(context) {
  return scheduleUnknownPageReload(context.kind);
}

function runGamePageReadyAutomation(context) {
  runGamePageAutomation(context.kind);
  return true;
}

function runPageReadyFlow(context) {
  for (const step of PAGE_READY_FLOW_STEPS) {
    if (step(context)) return;
  }
}

export function runPageAutomation(event = { type: EVENT_PAGE_READY }) {
  const handler = pageAutomationEventHandlers[event?.type];
  if (!handler) return false;
  return handler(event);
}
