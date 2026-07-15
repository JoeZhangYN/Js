import {
  LearnedMonsterFamily,
  LearnedMonsterStoreEvent,
  runLearnedMonsterStoreAutomation,
} from "./learned-monster-store.js";
import { normalizeLearnedMid, normalizeLearnedSkill } from "./big-skill-kill-normalize.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { getValue } from "./storage.js";

function readLegacyBigKillMap() {
  const source = getValue(STORAGE_KEYS.LEARNED_BIG_KILL, true) || {};
  const learned = {};
  for (const mid of Object.keys(source)) {
    const numericMid = normalizeLearnedMid(mid);
    if (numericMid == null) continue;
    const record = {};
    for (const skill of ["OFC", "FRD"]) {
      if (source[mid]?.[skill]) record[skill] = normalizeLearnedSkill(source[mid][skill]);
    }
    if (Object.keys(record).length) learned[numericMid] = record;
  }
  return learned;
}

export function readLearnedBigKillMap() {
  return runLearnedMonsterStoreAutomation({
    type: LearnedMonsterStoreEvent.READ_MAP,
    family: LearnedMonsterFamily.BIG_KILL,
    legacyProvider: readLegacyBigKillMap,
  });
}

export function hydrateLearnedBigKill() {
  return runLearnedMonsterStoreAutomation({
    type: LearnedMonsterStoreEvent.HYDRATE,
    family: LearnedMonsterFamily.BIG_KILL,
    legacyProvider: readLegacyBigKillMap,
  });
}
