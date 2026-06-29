import { AutoTuneEvent, runAutoTuneAutomation } from "../state/auto-tune.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "../state/battle-turn.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import { BattleSkillUsageEvent, runBattleSkillUsageAutomation } from "./battle-skill-usage.js";

const EVENT_ROUND_STARTED = "roundStarted";
const EVENT_ROUND_READY = "roundReady";

export const BattleRoundLifecycleEvent = Object.freeze({
  ROUND_STARTED: EVENT_ROUND_STARTED,
  ROUND_READY: EVENT_ROUND_READY,
});

function startRoundLifecycle() {
  runAutoTuneAutomation({ type: AutoTuneEvent.ROUND_STARTED });
  return runBattleTurnAutomation({ type: BattleTurnEvent.ROUND_STARTED });
}

function readyRoundLifecycle() {
  runBattleSkillUsageAutomation({ type: BattleSkillUsageEvent.RESET_ROUND });
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.ROUND_STARTED });
  return true;
}

export function runBattleRoundLifecycle(event = { type: EVENT_ROUND_STARTED }) {
  if (event.type === EVENT_ROUND_STARTED) return startRoundLifecycle();
  if (event.type === EVENT_ROUND_READY) return readyRoundLifecycle();
  return undefined;
}
