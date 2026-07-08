// 战斗外自动化编排入口：composition root 只调用本入口，不拼业务顺序。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { DayRecordEvent, runDayRecordAutomation } from "../state/day-record.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { QuickSiteEvent, runQuickSiteAutomation } from "../arena/quick-site.js";
import { RepairEvent, runRepairAutomation } from "../repair/repair-orchestrator.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";
import { isAutomaticEncounterEnabled } from "./encounter-option-gate.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "../battle/battle-runtime.js";

const EVENT_PAGE_READY = "pageReady";
const EVENT_ISEKAI_PAGE_READY = "isekaiPageReady";

export const LobbyEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
  ISEKAI_PAGE_READY: EVENT_ISEKAI_PAGE_READY,
});

const lobbyEventHandlers = Object.freeze({
  [EVENT_PAGE_READY]: () => runLobbyReadyFlow(LOBBY_READY_FLOW_STEPS, rerunLobbyPageReady),
  [EVENT_ISEKAI_PAGE_READY]: () =>
    runLobbyReadyFlow(ISEKAI_LOBBY_READY_FLOW_STEPS, rerunIsekaiLobbyPageReady),
});

const LOBBY_READY_FLOW_STEPS = [
  clearBattleSession,
  refreshLobbyDayRecord,
  captureLobbyAbilityPage,
  runQuickSiteLobbyReady,
  handleLobbyEncounter,
  stopWhenStaminaRequires,
  runNextBattleAutomation,
];

const ISEKAI_LOBBY_READY_FLOW_STEPS = [
  clearBattleSession,
  refreshLobbyDayRecord,
  captureLobbyAbilityPage,
  runQuickSiteLobbyReady,
  stopWhenStaminaRequires,
  runNextBattleAutomation,
];

function shouldStopForStamina() {
  return runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_LOBBY });
}

function isLobbyOptionEnabled(key) {
  const value = runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback: false });
  return value === true || value === 1 || value === "1" || value === "true";
}

function runNextBattleAutomation() {
  if (isLobbyOptionEnabled("repair")) {
    runRepairAutomation({ type: RepairEvent.START });
  } else if (isLobbyOptionEnabled("idleArena")) {
    runIdleArenaAutomation({ type: IdleArenaEvent.SCHEDULE_NEXT_BATTLE });
  }
}

function rerunLobbyPageReady() {
  return runLobbyAutomation({ type: EVENT_PAGE_READY });
}

function rerunIsekaiLobbyPageReady() {
  return runLobbyAutomation({ type: EVENT_ISEKAI_PAGE_READY });
}

function clearBattleSession() {
  runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION });
  return false;
}

function refreshLobbyDayRecord(context) {
  runDayRecordAutomation({
    type: DayRecordEvent.REFRESH_AND_SCHEDULE_NEXT_UTC_DAY,
    rerun: context.rerun,
  });
  return false;
}

function captureLobbyAbilityPage() {
  runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE });
  return false;
}

function runQuickSiteLobbyReady() {
  runQuickSiteAutomation({ type: QuickSiteEvent.LOBBY_READY });
  return false;
}

async function handleLobbyEncounter() {
  if (!isAutomaticEncounterEnabled()) return false;
  const encounterOutcome = await runEncounterAutomation({
    type: EncounterEvent.LOBBY_TICK,
    rerun: rerunLobbyPageReady,
  });
  return encounterOutcome?.claimed === true;
}

function stopWhenStaminaRequires() {
  return shouldStopForStamina();
}

async function runLobbyReadyFlow(steps, rerun) {
  const context = { rerun };
  for (const step of steps) {
    if (await step(context)) return;
  }
}

export async function runLobbyAutomation(event = { type: EVENT_PAGE_READY }) {
  return lobbyEventHandlers[event?.type]?.(event);
}
