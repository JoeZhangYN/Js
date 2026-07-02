const DEFAULT_ROUND_COUNT = 1;

function normalizeRoundCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : DEFAULT_ROUND_COUNT;
}

export function roundRuntime(roundNow, roundAll) {
  const normalizedRoundNow = normalizeRoundCount(roundNow);
  const normalizedRoundAll = normalizeRoundCount(roundAll);
  return {
    roundNow: normalizedRoundNow,
    roundAll: normalizedRoundAll,
    roundLeft: normalizedRoundAll - normalizedRoundNow,
  };
}
