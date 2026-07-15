export const BattleSessionCheckpointSlice = Object.freeze({
  CD_RUNTIME: "cdRuntime",
  BATTLE_REPORT: "battleReport",
});

export function emptyBattleSessionCheckpoint() {
  return { version: 2, slices: {} };
}

export function decodeBattleSessionCheckpoint(raw) {
  const parsed = JSON.parse(raw);
  if (parsed?.version === 2 && parsed.slices && typeof parsed.slices === "object") {
    return parsed;
  }
  return {
    version: 2,
    slices: { [BattleSessionCheckpointSlice.CD_RUNTIME]: parsed },
  };
}

export function updateBattleSessionCheckpointSlice(checkpoint, slice, value) {
  return {
    version: 2,
    slices: { ...checkpoint.slices, [slice]: value },
  };
}

export function clearBattleSessionCheckpointSlice(checkpoint, slice) {
  const slices = { ...checkpoint.slices };
  delete slices[slice];
  return { version: 2, slices };
}
