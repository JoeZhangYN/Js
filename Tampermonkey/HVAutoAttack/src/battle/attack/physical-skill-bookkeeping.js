import { CdRuntimeEvent, runCdRuntimeAutomation } from "../../state/cd-tracker.js";
import { CdLearningEvent, runCdLearningAutomation } from "../../state/cd-learner.js";
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "../../state/big-skill-kill-learner.js";
import { BattleSkillUsageEvent, runBattleSkillUsageAutomation } from "../battle-skill-usage.js";

const EVENT_RECORD_FIRE = "recordFire";

export const PhysicalSkillBookkeepingEvent = Object.freeze({
  RECORD_FIRE: EVENT_RECORD_FIRE,
});

export function runPhysicalSkillBookkeeping(event) {
  if (event.type !== EVENT_RECORD_FIRE) return;
  runBattleSkillUsageAutomation({
    type: BattleSkillUsageEvent.RECORD_USE,
    code: event.code,
  });
  runCdRuntimeAutomation({ type: CdRuntimeEvent.RECORD_FIRE, code: event.code });
  runCdLearningAutomation({
    type: CdLearningEvent.RECORD_FIRE,
    code: event.code,
    id: event.skillId,
    globalTurn: event.globalTurn,
  });
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.RECORD_CAST,
    code: event.code,
    globalTurn: event.globalTurn,
    observedBosses: event.observedBosses,
  });
}
