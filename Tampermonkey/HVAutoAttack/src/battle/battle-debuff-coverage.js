const EVENT_HAS_MISSING_DEBUFF = "hasMissingDebuff";

export const BattleDebuffCoverageEvent = Object.freeze({
  HAS_MISSING_DEBUFF: EVENT_HAS_MISSING_DEBUFF,
});

function hasMissingDebuffCoverage(snap, debuffName, monsterAlive = snap?.monsterAlive) {
  if (!debuffName || !monsterAlive) return false;
  const covered = (snap?.view || []).filter((m) =>
    (m.buffs || []).some((b) => b.includes(debuffName))
  ).length;
  return covered < monsterAlive;
}

export function runBattleDebuffCoverageAutomation(event = { type: EVENT_HAS_MISSING_DEBUFF }) {
  if (event.type === EVENT_HAS_MISSING_DEBUFF) {
    return hasMissingDebuffCoverage(event.snap, event.debuffName, event.monsterAlive);
  }
  return undefined;
}
