const aliveHpPercents = (monsters) =>
  (monsters || []).filter((monster) => !monster.isDead).map((monster) => monster.hpPercent);

const EVENT_READ_GEM = "readGem";
const EVENT_READ_STALL_TOPUP = "readStallTopup";
const EVENT_READ_SCROLL = "readScroll";
const EVENT_READ_POTION = "readPotion";

export const BattleItemFactsEvent = Object.freeze({
  READ_GEM: EVENT_READ_GEM,
  READ_STALL_TOPUP: EVENT_READ_STALL_TOPUP,
  READ_SCROLL: EVENT_READ_SCROLL,
  READ_POTION: EVENT_READ_POTION,
});

const battleItemFactsEventHandlers = Object.freeze({
  [EVENT_READ_GEM]: (event) => gemFacts(event.snap),
  [EVENT_READ_STALL_TOPUP]: (event) => stallTopupFacts(event.snap),
  [EVENT_READ_SCROLL]: (event) => scrollFacts(event.snap),
  [EVENT_READ_POTION]: (event) => potionFacts(event.snap),
});

function gemFacts(snap) {
  return {
    gemName: snap?.gemName,
    healthPercent: snap?.hp,
    manaPercent: snap?.mp,
    spiritPercent: snap?.sp,
    attackStatus: snap?.attackStatus,
    aliveMonsterHpPercents: aliveHpPercents(snap?.view),
    playerIncomingDps: snap?.playerIncomingDps,
  };
}

function stallTopupFacts(snap) {
  return {
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
    monsterFacts: snap?.view,
    overcharge: snap?.oc,
    manaPercent: snap?.mp,
    spiritPercent: snap?.sp,
    spiritOn: snap?.spiritOn,
    globalTurn: snap?.globalTurn,
    lastSpiritToggleGlobalTurn: snap?.lastSpiritToggleGlobalTurn,
    playerBuffs: snap?.playerBuffs,
  };
}

function scrollFacts(snap) {
  return {
    conditionFacts: snap,
    roundType: snap?.roundType,
    playerBuffs: snap?.playerBuffs,
  };
}

function potionFacts(snap) {
  return {
    conditionFacts: snap,
    deficitFacts: {
      hpDeficit: snap?.hpDeficit,
      mpDeficit: snap?.mpDeficit,
      spDeficit: snap?.spDeficit,
    },
  };
}

export function runBattleItemFacts(event = { type: EVENT_READ_GEM }) {
  return battleItemFactsEventHandlers[event.type]?.(event);
}
