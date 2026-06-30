const aliveHpPercents = (monsters) =>
  (monsters || []).filter((monster) => !monster.isDead).map((monster) => monster.hpPercent);

export function gemFacts(snap) {
  return {
    gemName: snap?.gemName,
    healthPercent: snap?.hp,
    manaPercent: snap?.mp,
    spiritPercent: snap?.sp,
    attackStatus: snap?.attackStatus,
    aliveMonsterHpPercents: aliveHpPercents(snap?.view),
    playerIncomingDps: snap?.playerIncomingDps,
  };
}

export function stallTopupFacts(snap) {
  return {
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
    monsterFacts: snap?.view,
    overcharge: snap?.oc,
    manaPercent: snap?.mp,
    spiritPercent: snap?.sp,
    spiritOn: snap?.spiritOn,
    globalTurn: snap?.globalTurn,
    lastSpiritToggleGlobalTurn: snap?.lastSpiritToggleGlobalTurn,
    playerBuffs: snap?.playerBuffs,
  };
}

export function scrollFacts(snap) {
  return {
    conditionFacts: snap,
    roundType: snap?.roundType,
    playerBuffs: snap?.playerBuffs,
  };
}

export function potionFacts(snap) {
  return {
    conditionFacts: snap,
    deficitFacts: {
      hpDeficit: snap?.hpDeficit,
      mpDeficit: snap?.mpDeficit,
      spDeficit: snap?.spDeficit,
    },
  };
}
