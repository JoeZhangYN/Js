import { gE } from "../dom/query.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";

const EVENT_READ_COMBATANT_COUNTS = "readCombatantCounts";
const EVENT_READ_REPAIR_SNAPSHOT = "readRepairSnapshot";
const EVENT_READ_HP_RUNTIME_SNAPSHOT = "readHpRuntimeSnapshot";

export const MonsterStatusViewEvent = Object.freeze({
  READ_COMBATANT_COUNTS: EVENT_READ_COMBATANT_COUNTS,
  READ_REPAIR_SNAPSHOT: EVENT_READ_REPAIR_SNAPSHOT,
  READ_HP_RUNTIME_SNAPSHOT: EVENT_READ_HP_RUNTIME_SNAPSHOT,
});

const monsterStatusViewEventHandlers = Object.freeze({
  [EVENT_READ_COMBATANT_COUNTS]: () => readCombatantCountSnapshot(),
  [EVENT_READ_REPAIR_SNAPSHOT]: () => readRepairSnapshot(),
  [EVENT_READ_HP_RUNTIME_SNAPSHOT]: () => readHpRuntimeSnapshot(),
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

function readActiveDebuffKeys(buffElement) {
  if (!buffElement) return [];
  return Array.from(DEBUFF_SKILL_LIB.entries())
    .filter(([, skill]) => gE(`img[src*="${skill.img}"]`, buffElement))
    .map(([key]) => key);
}

function readHpRuntimeSnapshot() {
  const hpElements = Array.from(gE("div.btm4>div.btm5:nth-child(1)", "all"));
  const monsterEls = Array.from(gE("div.btm1", "all"));
  const buffElements = Array.from(gE("div.btm6", "all"));

  return hpElements.map((hpElement, order) => {
    const hpImage = gE("img", hpElement);
    const nameElement = monsterEls[order]?.querySelector?.(".btm3");
    return {
      order,
      isDead: !!gE('img[src*="nbardead.png"]', hpElement),
      hpBarWidth: parseFloat(hpImage?.style?.width),
      name: nameElement ? nameElement.textContent.trim() : "",
      activeDebuffKeys: readActiveDebuffKeys(buffElements[order]),
    };
  });
}

export function runMonsterStatusView(event = { type: EVENT_READ_COMBATANT_COUNTS }) {
  return (
    monsterStatusViewEventHandlers[event?.type]?.(event) ?? {
      monsterAll: 0,
      monsterDead: 0,
      bossAll: 0,
      bossDead: 0,
    }
  );
}
