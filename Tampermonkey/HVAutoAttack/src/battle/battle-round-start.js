// 战斗轮次开始编排：怪物计数 / 轮次识别。
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { EncounterEvent, runEncounterAutomation } from "../pages/encounter.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { BattleStaminaEvent, runBattleStaminaAutomation } from "./battle-stamina.js";
import { BattleRoundLifecycleEvent, runBattleRoundLifecycle } from "./round-lifecycle.js";
import { BattleRoundStartLogEvent, runBattleRoundStartLog } from "./round-start-log.js";
import {
  BattleRoundStartEvidenceEvent,
  runBattleRoundStartEvidence,
} from "./battle-round-start-evidence.js";

const EVENT_ROUND_STARTED = "roundStarted";
const EVENT_UNKNOWN_ROUND_START = "unknownRoundStartEvent";

export const BattleRoundStartEvent = Object.freeze({
  ROUND_STARTED: EVENT_ROUND_STARTED,
});

function recordRoundStartContext(initializingText) {
  const context = runBattleRoundAutomation({
    type: BattleRoundEvent.RECORD_START_CONTEXT,
    initializingText,
  });
  if (context.randomEncounterStarted) {
    runEncounterAutomation({
      type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
    });
  }
  return context;
}

function cleanupBattleHash() {
  if (window.location.hash === "") return true;
  return runNavigationAutomation({
    type: NavigationEvent.RELOAD_NOW,
    reason: NavigationReloadReason.BATTLE_HASH_CLEANUP,
    detail: { source: "battleRoundStart", hash: window.location.hash },
  });
}

function recordStep(steps, step, result, detail) {
  steps.push({ step, result: result === undefined ? true : result, detail });
  return result;
}

function recordRoundStart(phase, result, steps) {
  runBattleRoundStartEvidence({
    type: BattleRoundStartEvidenceEvent.RECORD_ROUND_START,
    phase,
    result,
    steps,
  });
}

function startRound() {
  const steps = [];
  recordStep(
    steps,
    "roundStarted",
    runBattleRoundLifecycle({ type: BattleRoundLifecycleEvent.ROUND_STARTED })
  );
  recordStep(steps, "cleanupBattleHash", cleanupBattleHash());
  recordStep(
    steps,
    "refreshCombatants",
    runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS })
  );
  const roundStartLog = runBattleRoundStartLog({ type: BattleRoundStartLogEvent.READ_CURRENT });
  recordStep(steps, "readRoundStartLog", Boolean(roundStartLog));
  const { initializingText } = roundStartLog;
  const roundStartContext = recordRoundStartContext(initializingText);
  recordStep(steps, "recordStartContext", Boolean(roundStartContext), roundStartContext);
  const staminaOutcome = runBattleStaminaAutomation({
    type: BattleStaminaEvent.ROUND_LOG_READY,
    text: roundStartLog.firstText,
  });
  recordStep(steps, "staminaGate", !staminaOutcome.paused, staminaOutcome);
  if (staminaOutcome.paused) {
    recordRoundStart(EVENT_ROUND_STARTED, false, steps);
    return false;
  }
  const monsterStatusOutcome = runMonsterStatusAutomation({
    type: MonsterStatusEvent.PREPARE_ROUND_START,
    battleLogRows: roundStartLog.rows,
    initialized: roundStartContext.initialized,
  });
  recordStep(steps, "prepareMonsterStatus", !monsterStatusOutcome.repaired, monsterStatusOutcome);
  if (monsterStatusOutcome.repaired) {
    recordRoundStart(EVENT_ROUND_STARTED, false, steps);
    return false;
  }
  recordStep(steps, "recordStartCount", runBattleRoundAutomation({
    type: BattleRoundEvent.RECORD_START_COUNT,
    initializingText,
    roundType: roundStartContext.roundType,
    initialized: roundStartContext.initialized,
    repaired: monsterStatusOutcome.repaired,
  }));
  recordStep(steps, "syncRuntime", runBattleRoundAutomation({ type: BattleRoundEvent.SYNC_RUNTIME }));
  recordStep(
    steps,
    "roundReady",
    runBattleRoundLifecycle({ type: BattleRoundLifecycleEvent.ROUND_READY })
  );
  const ready = steps.every((step) => step.result !== false);
  recordRoundStart(EVENT_ROUND_STARTED, ready, steps);
  return ready;
}

const battleRoundStartEventHandlers = Object.freeze({
  [EVENT_ROUND_STARTED]: () => startRound(),
});

function rejectUnknownRoundStartEvent(event) {
  recordRoundStart(EVENT_UNKNOWN_ROUND_START, false, [
    {
      step: "routeEvent",
      result: false,
      reason: EVENT_UNKNOWN_ROUND_START,
      eventType: event?.type ?? null,
    },
  ]);
  return false;
}

export function runBattleRoundStartAutomation(event = { type: EVENT_ROUND_STARTED }) {
  return battleRoundStartEventHandlers[event?.type]?.(event) ?? rejectUnknownRoundStartEvent(event);
}
