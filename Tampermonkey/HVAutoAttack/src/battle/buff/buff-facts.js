export function buffPreparationFacts(snap) {
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
