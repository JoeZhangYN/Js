export function burstControlFacts(snap) {
  return {
    conditionFacts: snap,
    healthAbs: snap?.hpAbs,
    spiritOn: snap?.spiritOn,
    globalTurn: snap?.globalTurn,
    lastSpiritToggleGlobalTurn: snap?.lastSpiritToggleGlobalTurn,
    roundAll: snap?.roundAll,
    roundNow: snap?.roundNow,
    attackStatus: snap?.attackStatus,
    channeling: snap?.channeling,
    aliveCount: snap?.aliveCount,
    fightingStyle: snap?.fightingStyle,
    skillReady: snap?.skillReady,
    overcharge: snap?.oc,
    spellAoe: snap?.spellAoe,
    skillOTOS: snap?.skillOTOS,
    etherTapActiveX2: snap?.etherTapActiveX2,
    etherTapExpiring: snap?.etherTapExpiring,
    learnedBurstByMid: snap?.learnedBurstByMid,
    monsterFacts: snap?.view,
  };
}

export function bossImperilFacts(snap) {
  return {
    imperilSkillReady: !!snap?.skillReady?.["213"],
    imperilAoe: snap?.spellAoe?.Imperil,
    skillCooldowns: snap?.cdMap,
    overcharge: snap?.oc,
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
    monsterFacts: (snap?.view || []).map((monster) => ({
      id: monster.id,
      order: monster.order,
      monsterId: monster.monsterId,
      isDead: monster.isDead,
      isBoss: monster.isBoss,
      buffs: monster.buffs || [],
      hpMax: monster.hpMax,
      hpPercent: monster.hpPercent,
    })),
  };
}

export function allDebuffFacts(snap) {
  return {
    conditionFacts: snap,
    monsterAlive: snap?.monsterAlive,
    skillReady: snap?.skillReady,
    spellAoe: snap?.spellAoe,
    skillCooldowns: snap?.cdMap,
    aliveCount: snap?.aliveCount,
    overcharge: snap?.oc,
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
    monsterFacts: snap?.view,
  };
}

export function singleDebuffFacts(snap) {
  return {
    conditionFacts: snap,
    skillReady: snap?.skillReady,
    spellAoe: snap?.spellAoe,
    overcharge: snap?.oc,
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
    monsterFacts: snap?.view,
  };
}
