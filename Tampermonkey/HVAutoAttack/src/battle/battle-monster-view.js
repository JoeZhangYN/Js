import { MonsterCacheEvent, runMonsterCacheAutomation } from "../state/monster-cache.js";
import { aliveByOrder, byOrder, joinMonsterView, monsterHpVars } from "./monster-view.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const EVENT_READ_VIEW = "readView";
const EVENT_READ_ALIVE_BY_ORDER = "readAliveByOrder";
const EVENT_READ_BY_ORDER = "readByOrder";
const EVENT_READ_HP_VARS = "readHpVars";

export const BattleMonsterViewEvent = Object.freeze({
  READ_VIEW: EVENT_READ_VIEW,
  READ_ALIVE_BY_ORDER: EVENT_READ_ALIVE_BY_ORDER,
  READ_BY_ORDER: EVENT_READ_BY_ORDER,
  READ_HP_VARS: EVENT_READ_HP_VARS,
});

const EMPTY_MONSTER_VIEW = Object.freeze({
  view: [],
  monsterIdentities: [],
  aliveCount: 0,
  soloMonsterHpPercent: 100,
  lowestMonsterHpPercent: 100,
  firstMonsterHpPercent: 100,
});

const battleMonsterViewEventHandlers = Object.freeze({
  [EVENT_READ_VIEW]: (event) => readBattleMonsterView(event.monsters),
  [EVENT_READ_ALIVE_BY_ORDER]: (event) => aliveByOrder(event.view),
  [EVENT_READ_BY_ORDER]: (event) => byOrder(event.view),
  [EVENT_READ_HP_VARS]: (event) => monsterHpVars(event.view),
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
    ...runBattleMonsterView({ type: BattleMonsterViewEvent.READ_HP_VARS, view }),
  };
}

export function runBattleMonsterView(event = { type: EVENT_READ_VIEW }) {
  return battleMonsterViewEventHandlers[event.type]?.(event) ?? EMPTY_MONSTER_VIEW;
}
