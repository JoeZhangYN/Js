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

const conditionOnlyFacts = (snap) => ({ conditionFacts: conditionFacts(snap) });

export const fleeFacts = conditionOnlyFacts;
export const autoPauseFacts = conditionOnlyFacts;
export const defendFacts = conditionOnlyFacts;

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
    conditionFacts: conditionFacts(snap),
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

export function allDebuffFacts(snap) {
  return {
    conditionFacts: conditionFacts(snap),
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
    conditionFacts: conditionFacts(snap),
    skillReady: snap?.skillReady,
    spellAoe: snap?.spellAoe,
    overcharge: snap?.oc,
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
    monsterFacts: snap?.view,
  };
}

export function conditionFacts(snap) {
  // User-authored condition expressions address a variable map, so the snapshot is the condition context.
  return snap;
}
