const EVENT_READ_ACTIVE = "readActive";
const EVENT_SHOULD_RECAST = "shouldRecast";

export const BattlePlayerBuffStateEvent = Object.freeze({
  READ_ACTIVE: EVENT_READ_ACTIVE,
  SHOULD_RECAST: EVENT_SHOULD_RECAST,
});

const battlePlayerBuffStateEventHandlers = Object.freeze({
  [EVENT_READ_ACTIVE]: (event) => isPlayerBuffActive(event.state, event.img),
  [EVENT_SHOULD_RECAST]: (event) => shouldRecastPlayerBuff(event.state, event.img),
});

function isPlayerBuffActive(event = {}, img) {
  if (!img) return false;
  return (event.playerBuffs || []).includes(img);
}

function shouldRecastPlayerBuff(event = {}, img) {
  if (!img) return false;
  const turnsByImg = event.playerEffectTurns || {};
  if (Object.prototype.hasOwnProperty.call(turnsByImg, img)) {
    return turnsByImg[img] <= 1;
  }
  const existing = (event.playerEffects || []).find((effect) => effect.img === img);
  if (!existing) return true;
  return existing.turns <= 1;
}

export function runBattlePlayerBuffState(event = { type: EVENT_READ_ACTIVE }) {
  return battlePlayerBuffStateEventHandlers[event?.type]?.(event) ?? false;
}
