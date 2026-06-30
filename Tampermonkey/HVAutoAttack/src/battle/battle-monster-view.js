import { MonsterCacheEvent, runMonsterCacheAutomation } from "../state/monster-cache.js";
import { joinMonsterView, monsterHpVars } from "./monster-view.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const EVENT_READ_VIEW = "readView";

export const BattleMonsterViewEvent = Object.freeze({
  READ_VIEW: EVENT_READ_VIEW,
});

function readBattleMonsterView(monsters) {
  const monsterStatus = runMonsterStatusAutomation({ type: MonsterStatusEvent.READ_STATUS });
  const view = joinMonsterView(
    monsters || [],
    monsterStatus,
    runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_DB })
  );
  const monsterIdentities = view.map((monster) => ({
    monsterId: monster.monsterId,
    name: monster.name,
  }));
  return {
    view,
    monsterIdentities,
    aliveCount: view.filter((monster) => !monster.isDead).length,
    ...monsterHpVars(view),
  };
}

export function runBattleMonsterView(event = { type: EVENT_READ_VIEW }) {
  if (event.type === EVENT_READ_VIEW) return readBattleMonsterView(event.monsters);
  return {
    view: [],
    monsterIdentities: [],
    aliveCount: 0,
    ...monsterHpVars([]),
  };
}
