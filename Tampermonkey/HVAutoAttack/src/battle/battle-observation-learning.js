import { RecoveryLearningEvent, runRecoveryLearningAutomation } from "../state/recovery-learner.js";
import { CdLearningEvent, runCdLearningAutomation } from "../state/cd-learner.js";
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "../state/big-skill-kill-learner.js";
import {
  IncomingBurstLearningEvent,
  runIncomingBurstLearningAutomation,
} from "../state/incoming-burst-learner.js";

const EVENT_FINALIZE_TURN_OBSERVATIONS = "finalizeTurnObservations";

export const BattleObservationLearningEvent = Object.freeze({
  FINALIZE_TURN_OBSERVATIONS: EVENT_FINALIZE_TURN_OBSERVATIONS,
});

function readySkillIds(skillReady) {
  return Object.entries(skillReady || {})
    .filter(([, ready]) => ready)
    .map(([id]) => id);
}

function recoveryAbs(vitals) {
  return { hp: vitals.hpAbs, mp: vitals.mpAbs, sp: vitals.spAbs };
}

function liveMonsterIds(view) {
  return (view || [])
    .filter((monster) => monster.monsterId != null && !monster.isDead)
    .map((monster) => monster.monsterId);
}

function finalizeTurnObservations(event) {
  runRecoveryLearningAutomation({
    type: RecoveryLearningEvent.FINALIZE_PENDING,
    recoveryAbs: recoveryAbs(event.vitals || {}),
  });
  runCdLearningAutomation({
    type: CdLearningEvent.FINALIZE_PENDING,
    globalTurn: event.globalTurn,
    readySkillIds: readySkillIds(event.skillReady),
  });
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.FINALIZE_PENDING,
    globalTurn: event.globalTurn,
    liveMonsterIds: liveMonsterIds(event.view),
  });
  if (event.learnIncomingBurst) {
    runIncomingBurstLearningAutomation({
      type: IncomingBurstLearningEvent.RECORD_EVENTS,
      events: event.battleLog,
      monsterIdentities: event.monsterIdentities,
    });
    return {
      learnedBurstByMid: runIncomingBurstLearningAutomation({
        type: IncomingBurstLearningEvent.READ_MAP,
      }),
    };
  }
  return { learnedBurstByMid: {} };
}

const battleObservationLearningEventHandlers = Object.freeze({
  [EVENT_FINALIZE_TURN_OBSERVATIONS]: (event) => finalizeTurnObservations(event),
});

export function runBattleObservationLearning(event = { type: EVENT_FINALIZE_TURN_OBSERVATIONS }) {
  return battleObservationLearningEventHandlers[event.type]?.(event) || { learnedBurstByMid: {} };
}
