// 战斗外自动化编排入口：composition root 只调用本入口，不拼业务顺序。
import { DayRecordEvent, runDayRecordAutomation } from "../state/day-record.js";
import { QuickSiteEvent, runQuickSiteAutomation } from "../arena/quick-site.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "../battle/battle-runtime.js";
import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  createNextBattleArbitrationCapability,
  NextBattleArbitrationEvent,
} from "./next-battle-arbitration.js";

const EVENT_PAGE_READY = "pageReady";

export const LobbyEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

const LOBBY_READY_FLOW_STEPS = [
  clearBattleSession,
  refreshLobbyDayRecord,
  captureLobbyAbilityPage,
  runQuickSiteLobbyReady,
  runNextBattleAutomation,
];

async function runNextBattleAutomation(context) {
  await context.nextBattle.run({ type: NextBattleArbitrationEvent.PLAN });
  return false;
}

function clearBattleSession() {
  runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION });
  return false;
}

function refreshLobbyDayRecord() {
  runDayRecordAutomation({ type: DayRecordEvent.SYNC_UTC_DATE });
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

async function runLobbyReadyFlow(steps, nextBattle) {
  const context = { nextBattle };
  for (const step of steps) {
    if (await step(context)) return;
  }
}

export function createLobbyAutomationCapability({ randomEncounter }) {
  const steps = LOBBY_READY_FLOW_STEPS;
  const nextBattle = createNextBattleArbitrationCapability({ randomEncounter });
  const pendingFlows = new Map();
  const capability = Object.freeze({
    run(event = { type: EVENT_PAGE_READY }) {
      if (event?.type !== EVENT_PAGE_READY) return Promise.resolve(undefined);
      if (pendingFlows.has(EVENT_PAGE_READY)) return pendingFlows.get(EVENT_PAGE_READY);
      const pending = Promise.resolve()
        .then(() => runLobbyReadyFlow(steps, nextBattle))
        .finally(() => {
          if (pendingFlows.get(EVENT_PAGE_READY) === pending) {
            pendingFlows.delete(EVENT_PAGE_READY);
          }
        });
      pendingFlows.set(EVENT_PAGE_READY, pending);
      return pending;
    },
  });
  return capability;
}

const currentLobbyAutomation = createLobbyAutomationCapability({
  randomEncounter: CURRENT_WORLD_POLICY.features.randomEncounter,
});

export function runLobbyAutomation(event = { type: EVENT_PAGE_READY }) {
  return currentLobbyAutomation.run(event);
}
