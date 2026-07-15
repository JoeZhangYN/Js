import {
  LearnedMonsterFamily,
  LearnedMonsterStoreEvent,
  runLearnedMonsterStoreAutomation,
} from "./learned-monster-store.js";

export function readLearnedBigKillMap() {
  return runLearnedMonsterStoreAutomation({
    type: LearnedMonsterStoreEvent.READ_MAP,
    family: LearnedMonsterFamily.BIG_KILL,
  });
}

export function hydrateLearnedBigKill() {
  return runLearnedMonsterStoreAutomation({
    type: LearnedMonsterStoreEvent.HYDRATE,
    family: LearnedMonsterFamily.BIG_KILL,
  });
}
