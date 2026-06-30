export function shouldRecastPlayerBuff(event = {}, img) {
  if (!img) return false;
  const turnsByImg = event.playerEffectTurns || {};
  if (Object.prototype.hasOwnProperty.call(turnsByImg, img)) {
    return turnsByImg[img] <= 1;
  }
  const existing = (event.playerEffects || []).find((effect) => effect.img === img);
  if (!existing) return true;
  return existing.turns <= 1;
}
