// 当前战斗进度查询：round 与 combatant 事实统一从这里组合。
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const EVENT_READ_CONTEXT = "readContext";

export const BattleProgressEvent = Object.freeze({
  READ_CONTEXT: EVENT_READ_CONTEXT,
});

function readContext() {
  const round = runBattleRoundAutomation({ type: BattleRoundEvent.READ_RUNTIME });
  const combatants = runMonsterStatusAutomation({
    type: MonsterStatusEvent.READ_COMBATANT_COUNTS,
  });
  return {
    bossAlive: combatants.bossAlive,
    bossAll: combatants.bossAll,
    monsterAlive: combatants.monsterAlive,
    monsterAll: combatants.monsterAll,
    roundAll: round.roundAll,
    roundNow: round.roundNow,
    roundType: runBattleRoundAutomation({ type: BattleRoundEvent.READ_TYPE }),
  };
}

const battleProgressHandlers = Object.freeze({
  [EVENT_READ_CONTEXT]: () => readContext(),
});

export function runBattleProgressAutomation(event = { type: EVENT_READ_CONTEXT }) {
  return battleProgressHandlers[event.type]?.();
}
