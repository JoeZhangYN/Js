const EVENT_READ_PREPARATION = "read-preparation";

export const BattleBuffFactsEvent = Object.freeze({
  READ_PREPARATION: EVENT_READ_PREPARATION,
});

const battleBuffFactsEventHandlers = Object.freeze({
  [EVENT_READ_PREPARATION]: (event) => buffPreparationFacts(event.snap),
});

function buffPreparationFacts(snap) {
  return {
    conditionFacts: snap,
    attackStatus: snap?.attackStatus,
    channeling: snap?.channeling,
    skillReady: snap?.skillReady,
    playerEffects: snap?.playerEffects,
    playerBuffs: snap?.playerBuffs,
    spiritOn: snap?.spiritOn,
    playerEffectTurns: snap?.playerEffectTurns,
  };
}

export function runBattleBuffFacts(event = { type: EVENT_READ_PREPARATION }) {
  return battleBuffFactsEventHandlers[event.type]?.(event) ?? {};
}
