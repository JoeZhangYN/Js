export const BATTLE_RECORD_ARCHIVE_FAILURE_KEY = "HVAA:lastBattleRecordArchiveFailure";

export function recordBattleRecordArchiveFailure(stage, key, error) {
  const evidence = {
    capability: "battleRecordArchive",
    stage,
    key,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(BATTLE_RECORD_ARCHIVE_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Archive failure evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] battle record archive persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistBattleRecordArchiveStep(stage, key, write) {
  try {
    write();
    return true;
  } catch (error) {
    recordBattleRecordArchiveFailure(stage, key, error);
    return false;
  }
}
