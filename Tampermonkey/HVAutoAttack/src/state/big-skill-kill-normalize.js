function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export const normalizeTurn = (value) => Math.max(0, Math.trunc(normalizeNumber(value)));

const normalizeProbability = (value) => Math.max(0, Math.min(1, normalizeNumber(value)));

const normalizeSampleCount = (value) => Math.max(0, Math.trunc(normalizeNumber(value)));

function normalizeObservedBoss(value) {
  const mid = normalizeNumber(value?.mid, NaN);
  if (!Number.isFinite(mid)) return null;
  return {
    mid: Math.trunc(mid),
    hpMax: Math.max(0, normalizeNumber(value?.hpMax)),
    imperilActive: Boolean(value?.imperilActive),
  };
}

export function normalizePending(value) {
  if (!value || (value.skill !== "OFC" && value.skill !== "FRD")) return null;
  const bosses = (Array.isArray(value.bosses) ? value.bosses : [])
    .map(normalizeObservedBoss)
    .filter(Boolean);
  if (!bosses.length) return null;
  return {
    globalTurn: normalizeTurn(value.globalTurn),
    skill: value.skill,
    bosses,
  };
}

export function normalizeLiveMonsterIds(value) {
  const ids = Array.isArray(value) ? value : [];
  return new Set(
    ids
      .map((id) => normalizeNumber(id, NaN))
      .filter(Number.isFinite)
      .map((id) => Math.trunc(id))
  );
}

export function normalizeLearnedSkill(value) {
  return {
    killProbNoIm: normalizeProbability(value?.killProbNoIm),
    nNoIm: normalizeSampleCount(value?.nNoIm),
    killProbWithIm: normalizeProbability(value?.killProbWithIm),
    nWithIm: normalizeSampleCount(value?.nWithIm),
    lastHpMax: Math.max(0, normalizeNumber(value?.lastHpMax)),
  };
}

export function normalizeLearnedMid(value) {
  const mid = normalizeNumber(value, NaN);
  return Number.isFinite(mid) ? Math.trunc(mid) : null;
}
