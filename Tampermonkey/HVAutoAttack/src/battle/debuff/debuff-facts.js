const EVENT_READ_BURST_CONTROL = "readBurstControl";
const EVENT_READ_BOSS_IMPERIL = "readBossImperil";
const EVENT_READ_DEBUFF_ACTION = "readDebuffAction";

export const BattleDebuffFactsEvent = Object.freeze({
  READ_BURST_CONTROL: EVENT_READ_BURST_CONTROL,
  READ_BOSS_IMPERIL: EVENT_READ_BOSS_IMPERIL,
  READ_DEBUFF_ACTION: EVENT_READ_DEBUFF_ACTION,
});

const battleDebuffFactsEventHandlers = Object.freeze({
  [EVENT_READ_BURST_CONTROL]: (event) => burstControlFacts(event.snap),
  [EVENT_READ_BOSS_IMPERIL]: (event) => bossImperilFacts(event.snap),
  [EVENT_READ_DEBUFF_ACTION]: (event) => debuffActionFacts(event.snap),
});

function burstControlFacts(snap) {
  return {
    healthAbs: snap?.hpAbs,
    skillReady: snap?.skillReady,
    learnedBurstByMid: snap?.learnedBurstByMid,
    monsterFacts: snap?.view,
  };
}

function bossImperilFacts(snap) {
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

function debuffActionFacts(snap) {
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

export function runBattleDebuffFacts(event = { type: EVENT_READ_DEBUFF_ACTION }) {
  return battleDebuffFactsEventHandlers[event.type]?.(event);
}
