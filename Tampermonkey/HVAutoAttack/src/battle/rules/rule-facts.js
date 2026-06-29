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

export function criticalBuffFacts(snap) {
  return {
    manaPercent: snap?.mp,
    playerEffects: snap?.playerEffects,
  };
}

export function channelFacts(snap) {
  return {
    channeling: snap?.channeling,
    skillReady: snap?.skillReady,
    playerEffects: snap?.playerEffects,
    playerBuffs: snap?.playerBuffs,
  };
}

export function burstControlFacts(snap) {
  return {
    healthAbs: snap?.hpAbs,
    skillReady: snap?.skillReady,
    skillCooldowns: snap?.cdMap,
    overcharge: snap?.oc,
    learnedBurstByMid: snap?.learnedBurstByMid,
    monsterFacts: snap?.view,
  };
}

export function gemFacts(snap) {
  return {
    gemName: snap?.gemName,
    healthPercent: snap?.hp,
    manaPercent: snap?.mp,
    spiritPercent: snap?.sp,
    attackStatus: snap?.attackStatus,
    aliveMonsterHpPercents: (snap?.view || [])
      .filter((monster) => !monster.isDead)
      .map((monster) => monster.hpPercent),
    playerIncomingDps: snap?.playerIncomingDps,
  };
}

export function stallTopupFacts(snap) {
  return {
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
    aliveMonsterHpPercents: (snap?.view || [])
      .filter((monster) => !monster.isDead)
      .map((monster) => monster.hpPercent),
    overcharge: snap?.oc,
    manaPercent: snap?.mp,
    spiritPercent: snap?.sp,
    spiritOn: snap?.spiritOn,
    globalTurn: snap?.globalTurn,
    lastSpiritToggleGlobalTurn: snap?.lastSpiritToggleGlobalTurn,
    playerBuffs: snap?.playerBuffs,
  };
}

export function infusionFacts(snap) {
  return {
    conditionFacts: conditionFacts(snap),
    attackStatus: snap?.attackStatus,
    playerBuffs: snap?.playerBuffs,
  };
}

export function buffFacts(snap) {
  return {
    conditionFacts: conditionFacts(snap),
    spiritOn: snap?.spiritOn,
    skillReady: snap?.skillReady,
    playerBuffs: snap?.playerBuffs,
    playerEffectTurns: snap?.playerEffectTurns,
  };
}

export function conditionFacts(snap) {
  // User-authored condition expressions address a variable map, so the snapshot is the condition context.
  return snap;
}
