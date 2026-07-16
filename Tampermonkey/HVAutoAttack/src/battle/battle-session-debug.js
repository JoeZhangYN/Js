import { readBattleSession, writeBattleSession } from "./battle-session-store.js";
import {
  BattleSessionIdentitySource,
  createBattleSessionSnapshot,
  recordBattleSessionProgress,
} from "./battle-session-state.js";
import { readBattleSessionContext } from "./battle-session-lifecycle.js";

export function recordBattleSessionDebugFields(event, deps) {
  const values = Object.fromEntries(
    (event.fields || []).map((field) => [field.name, field.value || field.placeholder])
  );
  let snapshot = readBattleSession(deps).snapshot;
  if (values.roundType) {
    snapshot = createBattleSessionSnapshot(
      deps.createSessionId(),
      values.roundType,
      BattleSessionIdentitySource.DEBUG_OVERRIDE
    );
  }
  if (!snapshot) return null;
  snapshot = recordBattleSessionProgress(
    snapshot,
    values.roundNow ?? snapshot.progress.roundNow,
    values.roundAll ?? snapshot.progress.roundAll
  );
  if (!snapshot || !writeBattleSession(snapshot, deps)) return null;
  return values;
}

export function readBattleSessionDebugFields(deps) {
  const context = readBattleSessionContext(deps);
  return context
    ? {
        roundType: context.roundType,
        roundNow: String(context.roundNow),
        roundAll: String(context.roundAll),
      }
    : { roundType: "", roundNow: "", roundAll: "" };
}
