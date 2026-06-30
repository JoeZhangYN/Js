export function isScrollCoveredByPlayerBuffs(event = {}, scrollSpec = {}, options = {}) {
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
