export function criticalBuffFacts(snap) {
  return {
    manaPercent: snap?.mp,
    playerEffects: snap?.playerEffects,
  };
}
