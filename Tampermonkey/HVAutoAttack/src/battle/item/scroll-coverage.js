const EVENT_READ_COVERAGE = "readCoverage";

export const BattleScrollCoverageEvent = Object.freeze({
  READ_COVERAGE: EVENT_READ_COVERAGE,
});

const battleScrollCoverageEventHandlers = Object.freeze({
  [EVENT_READ_COVERAGE]: (event) =>
    isScrollCoveredByPlayerBuffs(event.state, event.scrollSpec, event.options),
});

function isScrollCoveredByPlayerBuffs(event = {}, scrollSpec = {}, options = {}) {
  const suffix = options.scrollFirst ? "_scroll" : "";
  const activeBuffs = event.playerBuffs || [];
  for (let j = 1; j <= Number(scrollSpec.mult || 0); j++) {
    const image = scrollSpec[`img${j}`];
    if (!image) continue;
    const needle = `${image}${suffix}`;
    if (activeBuffs.some((buff) => buff.includes(needle))) return true;
  }
  return false;
}

export function runBattleScrollCoverage(event = { type: EVENT_READ_COVERAGE }) {
  return battleScrollCoverageEventHandlers[event?.type]?.(event) ?? false;
}
