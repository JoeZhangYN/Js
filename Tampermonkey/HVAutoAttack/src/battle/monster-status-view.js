import { gE } from "../dom/query.js";

const EVENT_READ_COMBATANT_COUNTS = "readCombatantCounts";
const EVENT_READ_REPAIR_SNAPSHOT = "readRepairSnapshot";

export const MonsterStatusViewEvent = Object.freeze({
  READ_COMBATANT_COUNTS: EVENT_READ_COMBATANT_COUNTS,
  READ_REPAIR_SNAPSHOT: EVENT_READ_REPAIR_SNAPSHOT,
});

function readCombatantCountSnapshot() {
  const monsterAll = gE("div.btm1", "all").length;
  const monsterDead = gE('img[src*="nbardead"]', "all").length;
  const bossAll = gE('div.btm2[style^="background"]', "all").length;
  const bossDead = gE('div.btm1[style*="opacity"] div.btm2[style*="background"]', "all").length;

  return {
    monsterAll,
    monsterDead,
    bossAll,
    bossDead,
  };
}

function readRepairSnapshot() {
  const monsters = Array.from(gE("div.btm2", "all"));
  return {
    monsterAll: monsters.length,
    inferredStatus: monsters.map((monster, i) => ({
      order: i,
      id: i === 9 ? 0 : i + 1,
      hp: monster.style.background === "" ? 1000 : 100000,
      hpInferred: true,
    })),
  };
}

export function runMonsterStatusView(event = { type: EVENT_READ_COMBATANT_COUNTS }) {
  if (event.type === EVENT_READ_COMBATANT_COUNTS) return readCombatantCountSnapshot();
  if (event.type === EVENT_READ_REPAIR_SNAPSHOT) return readRepairSnapshot();
  return {
    monsterAll: 0,
    monsterDead: 0,
    bossAll: 0,
    bossDead: 0,
  };
}
