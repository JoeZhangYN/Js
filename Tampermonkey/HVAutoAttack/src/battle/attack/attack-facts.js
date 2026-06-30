const EVENT_READ_ACTION = "read-action";

export const BattleAttackFactsEvent = Object.freeze({
  READ_ACTION: EVENT_READ_ACTION,
});

const battleAttackFactsEventHandlers = Object.freeze({
  [EVENT_READ_ACTION]: (event) => attackFacts(event.snap),
});

function attackFacts(snap) {
  return {
    conditionFacts: snap,
    spiritOn: snap?.spiritOn,
    globalTurn: snap?.globalTurn,
    lastSpiritToggleGlobalTurn: snap?.lastSpiritToggleGlobalTurn,
    roundAll: snap?.roundAll,
    roundNow: snap?.roundNow,
    attackStatus: snap?.attackStatus,
    channeling: snap?.channeling,
    aliveCount: snap?.aliveCount,
    fightingStyle: snap?.fightingStyle,
    overcharge: snap?.oc,
    skillReady: snap?.skillReady,
    spellAoe: snap?.spellAoe,
    skillOTOS: snap?.skillOTOS,
    etherTapActiveX2: snap?.etherTapActiveX2,
    etherTapExpiring: snap?.etherTapExpiring,
    monsterFacts: snap?.view,
  };
}

export function runBattleAttackFacts(event = { type: EVENT_READ_ACTION }) {
  return battleAttackFactsEventHandlers[event.type]?.(event) ?? {};
}
