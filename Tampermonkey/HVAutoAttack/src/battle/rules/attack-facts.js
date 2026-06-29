import { conditionFacts } from "./rule-facts.js";

export function attackFacts(snap) {
  return {
    conditionFacts: conditionFacts(snap),
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
