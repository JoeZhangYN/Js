const EVENT_APPLY = "apply";

export const MonsterTargetWeightEvent = Object.freeze({
  APPLY: EVENT_APPLY,
});

const monsterTargetWeightEventHandlers = Object.freeze({
  [EVENT_APPLY]: (event) =>
    applyTargetWeights(event.monsterStatus || [], event.runtimeSnapshot || [], event.options || {}),
});

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function optionWeight(weights, key) {
  const weight = Number(weights?.[key]);
  return Number.isFinite(weight) ? weight : 0;
}

function liveHpValues(monsterStatus) {
  return monsterStatus
    .filter((status) => !status.isDead)
    .map((status) => finitePositive(status.currentHp))
    .filter((hpNow) => hpNow != null);
}

function runtimeByOrder(runtimeSnapshot) {
  return new Map((runtimeSnapshot || []).map((monster) => [monster.order, monster]));
}

function applyTargetWeights(monsterStatus, runtimeSnapshot, options) {
  const hpValues = liveHpValues(monsterStatus);
  const hpLowest = hpValues.length ? Math.min(...hpValues) : 1;
  const hpMost = hpValues.length ? Math.max(...hpValues) : 1;
  const isReverse = !!options?.ruleReverse;
  const weightFactor = isReverse ? hpMost * 10 : 10 / hpLowest;
  const factsByOrder = runtimeByOrder(runtimeSnapshot);

  return monsterStatus
    .map((status) => {
      const currentHp = finitePositive(status.currentHp);
      if (status.isDead || currentHp == null) {
        return { ...status, finWeight: Infinity };
      }

      let finWeight = isReverse ? weightFactor / currentHp : currentHp * weightFactor;
      const runtimeFacts = factsByOrder.get(status.order);
      (runtimeFacts?.activeDebuffKeys || []).forEach((key) => {
        finWeight += isReverse
          ? -optionWeight(options?.weight, key)
          : optionWeight(options?.weight, key);
      });
      return { ...status, finWeight };
    })
    .sort((a, b) => a.finWeight - b.finWeight);
}

export function runMonsterTargetWeight(event = { type: EVENT_APPLY }) {
  return monsterTargetWeightEventHandlers[event.type]?.(event) ?? [];
}
