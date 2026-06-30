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

export function conditionFacts(snap) {
  // User-authored condition expressions address a variable map, so the snapshot is the condition context.
  return snap;
}
