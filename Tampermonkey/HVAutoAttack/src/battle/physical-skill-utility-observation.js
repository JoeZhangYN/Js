import {
  UtilityWeightLearningEvent,
  runUtilityWeightLearning,
} from "../state/utility-weight-learner.js";
import { BattleMonsterSurfaceEvent, runBattleMonsterSurface } from "./battle-monster-surface.js";
import { BattleMonsterViewEvent, runBattleMonsterView } from "./battle-monster-view.js";

const EVENT_FINALIZE_AFTER_ACTION = "finalizeAfterAction";

export const PhysicalSkillUtilityObservationEvent = Object.freeze({
  FINALIZE_AFTER_ACTION: EVENT_FINALIZE_AFTER_ACTION,
});

function finalizeAfterAction() {
  const monsters = runBattleMonsterSurface({ type: BattleMonsterSurfaceEvent.READ_CURRENT });
  const { view } = runBattleMonsterView({ type: BattleMonsterViewEvent.READ_VIEW, monsters });
  return runUtilityWeightLearning({
    type: UtilityWeightLearningEvent.FINALIZE_PHYSICAL_ACTION,
    view,
  });
}

const observationHandlers = Object.freeze({
  [EVENT_FINALIZE_AFTER_ACTION]: finalizeAfterAction,
});

export function runPhysicalSkillUtilityObservation(event = { type: EVENT_FINALIZE_AFTER_ACTION }) {
  return (
    observationHandlers[event?.type]?.(event) ?? {
      kind: "rejected",
      reason: "unknownPhysicalSkillUtilityObservationEvent",
    }
  );
}
