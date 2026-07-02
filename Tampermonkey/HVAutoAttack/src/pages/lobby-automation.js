// 战斗外自动化编排入口：composition root 只调用本入口，不拼业务顺序。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { DayRecordEvent, runDayRecordAutomation } from "../state/day-record.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { QuickSiteEvent, runQuickSiteAutomation } from "../arena/quick-site.js";
import { RepairEvent, runRepairAutomation } from "../repair/repair-orchestrator.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "../battle/battle-runtime.js";

const EVENT_PAGE_READY = "pageReady";

export const LobbyEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

const lobbyEventHandlers = Object.freeze({
  [EVENT_PAGE_READY]: () => runLobbyReadyFlow(),
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

function shouldStopForStamina() {
  return runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_LOBBY });
}

function isLobbyOptionEnabled(key) {
  return Boolean(runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback: false }));
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

function clearBattleSession() {
  runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION });
  return false;
}

function refreshLobbyDayRecord() {
  runDayRecordAutomation({
    type: DayRecordEvent.REFRESH_AND_SCHEDULE_NEXT_UTC_DAY,
    rerun: rerunLobbyPageReady,
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
  if (!isLobbyOptionEnabled("encounter")) return false;
  const encounterOutcome = await runEncounterAutomation({
    type: EncounterEvent.LOBBY_TICK,
    rerun: rerunLobbyPageReady,
  });
  return Boolean(encounterOutcome.claimed);
}

function stopWhenStaminaRequires() {
  return shouldStopForStamina();
}

async function runLobbyReadyFlow() {
  for (const step of LOBBY_READY_FLOW_STEPS) {
    if (await step()) return;
  }
}

export async function runLobbyAutomation(event = { type: EVENT_PAGE_READY }) {
  return lobbyEventHandlers[event?.type]?.(event);
}
