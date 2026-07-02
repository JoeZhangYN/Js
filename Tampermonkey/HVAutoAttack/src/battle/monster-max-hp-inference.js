import { MonsterDbStoreEvent, runMonsterDbStoreAutomation } from "../state/monster-db-store.js";
import { normalizeMonsterName } from "../monster/monster-identity.js";
import { BattleLogParserEvent, runBattleLogParser } from "./battle-log-parser.js";
import { recordMonsterKnowledgePersistenceFailure } from "./monster-knowledge-persistence-evidence.js";

const EVENT_APPLY_DEATHS = "applyDeaths";

export const MonsterMaxHpInferenceEvent = Object.freeze({
  APPLY_DEATHS: EVENT_APPLY_DEATHS,
});

const monsterMaxHpInferenceEventHandlers = Object.freeze({
  [EVENT_APPLY_DEATHS]: (event, deps) => applyDeathInferences(event, makeDeps(deps)),
});

/**
 * This page-local guard keeps repeated dead DOM snapshots from repeatedly parsing
 * the same battle log and checking the same monster DB key.
 * @type {Set<string>}
 */
const inferredThisPage = new Set();

function makeDeps(deps) {
  return {
    accumulateDamageByMonster:
      deps.accumulateDamageByMonster ||
      ((events) =>
        runBattleLogParser({
          type: BattleLogParserEvent.ACCUMULATE_DAMAGE_BY_MONSTER,
          events,
        })),
    normalizeMonsterName: deps.normalizeMonsterName || normalizeMonsterName,
    readStoredMaxHp:
      deps.readStoredMaxHp ||
      ((monsterId, level) =>
        runMonsterDbStoreAutomation({
          type: MonsterDbStoreEvent.HP_READ,
          monsterId,
          level,
        })),
    writeStoredMaxHp:
      deps.writeStoredMaxHp ||
      ((monsterId, level, maxHP) =>
        runMonsterDbStoreAutomation({
          type: MonsterDbStoreEvent.HP_WRITE,
          monsterId,
          level,
          maxHP,
        })),
    recordPersistenceFailure:
      deps.recordPersistenceFailure || recordMonsterKnowledgePersistenceFailure,
  };
}

function storeIfMissing(monsterId, level, inferredMaxHP, deps) {
  if (monsterId == null || level == null || !(inferredMaxHP > 0)) return;
  Promise.resolve(deps.readStoredMaxHp(monsterId, level))
    .then((existing) => {
      if (existing && existing.maxHP != null) return undefined;
      return deps.writeStoredMaxHp(monsterId, level, inferredMaxHP);
    })
    .catch((error) =>
      deps.recordPersistenceFailure({
        stage: "death-inference-store-hp",
        monsterId,
        level,
        maxHP: inferredMaxHP,
        error,
      })
    );
}

function applyDeathInferences(event, deps) {
  const monsterStatus = Array.isArray(event.monsterStatus) ? event.monsterStatus : [];
  const runtimeSnapshot = Array.isArray(event.runtimeSnapshot) ? event.runtimeSnapshot : [];
  const statusByOrder = new Map(monsterStatus.map((status) => [status.order, status]));
  const deathCandidates = runtimeSnapshot.filter(
    (monster) => monster.isDead && monster.name && !inferredThisPage.has(monster.name)
  );

  if (!deathCandidates.length) return [];

  const battleLog = Array.isArray(event.battleLog) ? event.battleLog : [];
  const damageByMonster = deps.accumulateDamageByMonster(battleLog);
  const learned = [];
  for (const monster of deathCandidates) {
    inferredThisPage.add(monster.name);
    const accumulated = damageByMonster.get(deps.normalizeMonsterName(monster.name));
    if (!accumulated || !(accumulated.totalDamage > 0)) continue;

    const status = statusByOrder.get(monster.order);
    if (!status) continue;

    status.inferredMaxHP = accumulated.totalDamage;
    learned.push({
      order: monster.order,
      monsterId: status.monsterId,
      level: status.level,
      inferredMaxHP: accumulated.totalDamage,
    });
    storeIfMissing(status.monsterId, status.level, accumulated.totalDamage, deps);
  }
  return learned;
}

export function runMonsterMaxHpInference(event = { type: EVENT_APPLY_DEATHS }, deps = {}) {
  return monsterMaxHpInferenceEventHandlers[event?.type]?.(event, deps) ?? [];
}
