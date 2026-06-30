// Monster HP runtime update implementation. Called only by monster-status-automation.
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { MonsterStatusViewEvent, runMonsterStatusView } from "./monster-status-view.js";
import { BattleLogTelemetryEvent, runBattleLogTelemetry } from "./battle-log-telemetry.js";
import {
  MonsterMaxHpInferenceEvent,
  runMonsterMaxHpInference,
} from "./monster-max-hp-inference.js";
import { MonsterTargetWeightEvent, runMonsterTargetWeight } from "./monster-target-weight.js";

const EVENT_UPDATE = "update";

export const MonsterStatusHpRuntimeEvent = Object.freeze({
  UPDATE: EVENT_UPDATE,
});

const monsterStatusHpRuntimeEventHandlers = Object.freeze({
  [EVENT_UPDATE]: updateMonsterHpRuntime,
});

function readTargetWeightOptions() {
  return {
    ruleReverse: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "ruleReverse",
      fallback: false,
    }),
    weight: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "weight",
      fallback: {},
    }),
  };
}

function readBattleLogTelemetryForHpUpdate(event) {
  if (event?.logTelemetry) return event.logTelemetry;
  if (Array.isArray(event?.battleLog)) return { battleLog: event.battleLog };
  return runBattleLogTelemetry({
    type: BattleLogTelemetryEvent.READ_CURRENT,
    turn: event?.turn,
  });
}

function updateMonsterHpRuntime(event = {}) {
  const monsterStatus = g("monsterStatus");
  if (!Array.isArray(monsterStatus)) return;

  const runtimeSnapshot = runMonsterStatusView({
    type: MonsterStatusViewEvent.READ_HP_RUNTIME_SNAPSHOT,
  });
  const statusByOrder = new Map(monsterStatus.map((status) => [status.order, status]));

  runtimeSnapshot.forEach((monster) => {
    const status = statusByOrder.get(monster.order);
    if (!status) return;
    const hpNow = monster.isDead
      ? Infinity
      : Math.floor((status.hp * monster.hpBarWidth) / 120) + 1;

    status.isDead = monster.isDead;
    status.hpNow = hpNow;
  });

  const logTelemetry = readBattleLogTelemetryForHpUpdate(event);

  runMonsterMaxHpInference({
    type: MonsterMaxHpInferenceEvent.APPLY_DEATHS,
    battleLog: logTelemetry.battleLog,
    monsterStatus,
    runtimeSnapshot,
  });

  const weightedStatuses = runMonsterTargetWeight({
    type: MonsterTargetWeightEvent.APPLY,
    monsterStatus: monsterStatus.map((status) => ({
      order: status.order,
      currentHp: status.hpNow,
      isDead: status.isDead,
    })),
    runtimeSnapshot,
    options: readTargetWeightOptions(),
  });
  weightedStatuses.forEach((weightedStatus) => {
    const status = statusByOrder.get(weightedStatus.order);
    if (status) status.finWeight = weightedStatus.finWeight;
  });
  monsterStatus.sort((a, b) => a.finWeight - b.finWeight);

  g("monsterStatus", monsterStatus);
  return { battleLogTelemetry: logTelemetry };
}

export function runMonsterStatusHpRuntime(event = { type: EVENT_UPDATE }) {
  return monsterStatusHpRuntimeEventHandlers[event.type]?.(event) ?? false;
}
