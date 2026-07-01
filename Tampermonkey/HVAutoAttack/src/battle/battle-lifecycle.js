import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import {
  BattleStartRuntimeEvent,
  runBattleStartRuntimeAutomation,
} from "./battle-start-runtime.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import {
  BattleLifecycleEvidenceEvent,
  runBattleLifecycleEvidence,
} from "./battle-lifecycle-evidence.js";

const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_UNKNOWN_BATTLE_LIFECYCLE = "unknownBattleLifecycleEvent";

export const BattleLifecycleEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
});

function recordStep(steps, step, run) {
  const result = run();
  steps.push({ step, result: result === undefined ? true : result });
  return result;
}

function startBattle(deps) {
  const steps = [];
  recordStep(steps, "startRuntime", deps.startRuntime);
  recordStep(steps, "startKnowledge", deps.startKnowledge);
  recordStep(steps, "startMonitor", deps.startMonitor);
  const started = steps.every((step) => step.result);
  deps.recordLifecycle(EVENT_BATTLE_STARTED, started, steps);
  return started;
}

const battleLifecycleHandlers = Object.freeze({
  [EVENT_BATTLE_STARTED]: (_event, deps) => startBattle(deps),
});

function rejectUnknownBattleLifecycleEvent(event, deps) {
  deps.recordLifecycle(EVENT_UNKNOWN_BATTLE_LIFECYCLE, false, [
    {
      step: "routeEvent",
      result: false,
      reason: EVENT_UNKNOWN_BATTLE_LIFECYCLE,
      eventType: event?.type ?? null,
    },
  ]);
  return false;
}

export function runBattleLifecycleAutomation(
  event = { type: EVENT_BATTLE_STARTED },
  deps = {
    startRuntime: () =>
      runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.BATTLE_STARTED }),
    startKnowledge: () =>
      runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.BATTLE_STARTED }),
    startMonitor: () => runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED }),
    recordLifecycle: (phase, result, steps) =>
      runBattleLifecycleEvidence({
        type: BattleLifecycleEvidenceEvent.RECORD_LIFECYCLE,
        phase,
        result,
        steps,
      }),
  }
) {
  return battleLifecycleHandlers[event?.type]?.(event, deps) ?? rejectUnknownBattleLifecycleEvent(event, deps);
}
