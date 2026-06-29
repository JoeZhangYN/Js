import { MonsterCacheEvent, runMonsterCacheAutomation } from "../state/monster-cache.js";
import {
  MonsterStatusEvent,
  runMonsterStatusAutomation,
} from "../battle/monster-status-automation.js";

const EVENT_BUILD_ROWS = "buildRows";

export const MonsterResistPanelModelEvent = Object.freeze({
  BUILD_ROWS: EVENT_BUILD_ROWS,
});

function makeDeps(deps) {
  return {
    primeProfiles:
      deps.primeProfiles ||
      ((monsterIds) =>
        runMonsterCacheAutomation({ type: MonsterCacheEvent.PRIME_PROFILES, monsterIds })),
    readProfile:
      deps.readProfile ||
      ((monsterId) =>
        runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_PROFILE, monsterId })),
    readMonsterIdByOrder:
      deps.readMonsterIdByOrder ||
      (() => runMonsterStatusAutomation({ type: MonsterStatusEvent.READ_IDS_BY_ORDER })),
  };
}

async function buildRows(monsterNames, deps) {
  const names = Array.isArray(monsterNames) ? monsterNames : [];
  const readMonsterIdByOrder = deps.readMonsterIdByOrder();
  const monsterIds = names.map((_, order) => readMonsterIdByOrder(order));
  await deps.primeProfiles(monsterIds);
  return names
    .map((name, order) => ({
      name,
      info: name ? deps.readProfile(monsterIds[order]) : null,
    }))
    .filter((row) => row.name);
}

const resistPanelModelEventHandlers = Object.freeze({
  [EVENT_BUILD_ROWS]: (event, deps) => buildRows(event.monsterNames, makeDeps(deps)),
});

export function runMonsterResistPanelModel(event = { type: EVENT_BUILD_ROWS }, deps = {}) {
  return resistPanelModelEventHandlers[event.type]?.(event, deps) || [];
}
