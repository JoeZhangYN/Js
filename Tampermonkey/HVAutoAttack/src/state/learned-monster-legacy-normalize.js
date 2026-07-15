import { normalizeLearnedMid, normalizeLearnedSkill } from "./big-skill-kill-normalize.js";

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function normalizeLegacyBigKillMap(source) {
  const learned = {};
  for (const mid of Object.keys(source || {})) {
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

export function normalizeLegacyIncomingBurstMap(source) {
  const learned = {};
  for (const [mid, value] of Object.entries(source || {})) {
    const normalizedMid = positiveNumber(mid);
    const maxHit = positiveNumber(value?.maxHit);
    if (normalizedMid == null || maxHit == null) continue;
    learned[Math.trunc(normalizedMid)] = {
      maxHit,
      type: typeof value?.type === "string" && value.type ? value.type : "unknown",
    };
  }
  return learned;
}
