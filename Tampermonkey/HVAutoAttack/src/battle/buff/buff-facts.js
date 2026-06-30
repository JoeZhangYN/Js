export function infusionFacts(snap) {
  return {
    conditionFacts: snap,
    attackStatus: snap?.attackStatus,
    playerBuffs: snap?.playerBuffs,
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

export function buffFacts(snap) {
  return {
    conditionFacts: snap,
    spiritOn: snap?.spiritOn,
    skillReady: snap?.skillReady,
    playerBuffs: snap?.playerBuffs,
    playerEffectTurns: snap?.playerEffectTurns,
  };
}
