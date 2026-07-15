import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "../state/big-skill-kill-learner.js";
import {
  IncomingBurstLearningEvent,
  runIncomingBurstLearningAutomation,
} from "../state/incoming-burst-learner.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";

const EVENT_HYDRATE = "hydrate";

export const BattleLearningRuntimeEvent = Object.freeze({ HYDRATE: EVENT_HYDRATE });

async function hydrateLearningRuntime() {
  const results = await Promise.all([
    runBigSkillKillLearningAutomation({ type: BigSkillKillLearningEvent.HYDRATE }),
    runIncomingBurstLearningAutomation({ type: IncomingBurstLearningEvent.HYDRATE }),
  ]);
  if (results.some((result) => result?.outcome === StorageWriteOutcome.FAILED)) {
    return { kind: "failed", reason: "learningHydrationFailed" };
  }
  return true;
}

const handlers = Object.freeze({ [EVENT_HYDRATE]: hydrateLearningRuntime });

export function runBattleLearningRuntime(event = { type: EVENT_HYDRATE }) {
  return handlers[event?.type]?.(event);
}
