// Monster HP runtime update implementation. Called only by monster-status-automation.
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { MonsterStatusViewEvent, runMonsterStatusView } from "./monster-status-view.js";
import {
  MonsterMaxHpInferenceEvent,
  runMonsterMaxHpInference,
} from "./monster-max-hp-inference.js";

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

export function updateMonsterHpRuntime() {
  const monsterStatus = g("monsterStatus");
  if (!Array.isArray(monsterStatus)) return;

  const runtimeSnapshot = runMonsterStatusView({
    type: MonsterStatusViewEvent.READ_HP_RUNTIME_SNAPSHOT,
  });
  const statusByOrder = new Map(monsterStatus.map((status) => [status.order, status]));
  const hpArray = [];

  runtimeSnapshot.forEach((monster) => {
    const status = statusByOrder.get(monster.order);
    if (!status) return;
    const hpNow = monster.isDead
      ? Infinity
      : Math.floor((status.hp * monster.hpBarWidth) / 120) + 1;

    status.isDead = monster.isDead;
    status.hpNow = hpNow;

    if (!monster.isDead) hpArray.push(hpNow);
  });

  runMonsterMaxHpInference({
    type: MonsterMaxHpInferenceEvent.APPLY_DEATHS,
    monsterStatus,
    runtimeSnapshot,
  });

  const hpLowest = Math.min(...hpArray);
  const hpMost = Math.max(...hpArray);
  const targetWeightOptions = readTargetWeightOptions();
  const isReverse = targetWeightOptions.ruleReverse;
  const weightFactor = isReverse ? hpMost * 10 : 10 / hpLowest;

  monsterStatus.forEach((monster) => {
    monster.finWeight = monster.isDead
      ? Infinity
      : isReverse
        ? weightFactor / monster.hpNow
        : monster.hpNow * weightFactor;
  });

  runtimeSnapshot.forEach((monster) => {
    const status = statusByOrder.get(monster.order);
    if (!status) return;
    monster.activeDebuffKeys.forEach((key) => {
      status.finWeight += isReverse
        ? -targetWeightOptions.weight[key]
        : targetWeightOptions.weight[key];
    });
  });

  monsterStatus.sort((a, b) => a.finWeight - b.finWeight);
  g("monsterStatus", monsterStatus);
}
