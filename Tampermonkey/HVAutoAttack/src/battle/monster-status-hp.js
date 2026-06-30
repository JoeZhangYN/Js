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

function readBattleLogForHpUpdate(event) {
  if (Array.isArray(event?.battleLog)) return event.battleLog;
  return runBattleLogTelemetry({ type: BattleLogTelemetryEvent.READ_CURRENT }).battleLog;
}

export function updateMonsterHpRuntime(event = {}) {
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

  runMonsterMaxHpInference({
    type: MonsterMaxHpInferenceEvent.APPLY_DEATHS,
    battleLog: readBattleLogForHpUpdate(event),
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
}
