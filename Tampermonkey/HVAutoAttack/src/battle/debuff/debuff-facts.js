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
