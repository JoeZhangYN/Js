export function burstControlFacts(snap) {
  return {
    healthAbs: snap?.hpAbs,
    skillReady: snap?.skillReady,
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
