const EVENT_HAS_MISSING_DEBUFF = "hasMissingDebuff";

export const BattleDebuffCoverageEvent = Object.freeze({
  HAS_MISSING_DEBUFF: EVENT_HAS_MISSING_DEBUFF,
});

const battleDebuffCoverageEventHandlers = Object.freeze({
  [EVENT_HAS_MISSING_DEBUFF]: (event) =>
    hasMissingDebuffCoverage(event.monsterBuffs, event.debuffName, event.monsterAlive),
});

function hasMissingDebuffCoverage(monsterBuffs, debuffName, monsterAlive) {
  if (!debuffName || !monsterAlive) return false;
  const covered = (monsterBuffs || []).filter((buffs) =>
    (buffs || []).some((b) => b.includes(debuffName))
  ).length;
  return covered < monsterAlive;
}

export function runBattleDebuffCoverageAutomation(event = { type: EVENT_HAS_MISSING_DEBUFF }) {
  return battleDebuffCoverageEventHandlers[event.type]?.(event);
}
