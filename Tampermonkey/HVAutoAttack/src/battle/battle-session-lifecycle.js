import {
  BattleSessionIdentitySource,
  BattleSessionPhase,
  classifyBattleRoundType,
  createBattleSessionSnapshot,
  isBattleInitialization,
  markBattleSessionTerminal,
  readStartProgress,
  recordBattleSessionProgress,
} from "./battle-session-state.js";
import { readBattleSession, writeBattleSession } from "./battle-session-store.js";

export function startOrResumeBattleSession(event, deps) {
  const initializingText = String(event.initializingText || "");
  if (isBattleInitialization(initializingText)) {
    const roundType = classifyBattleRoundType(initializingText);
    if (!roundType) {
      return {
        ok: false,
        mode: "unknown",
        initialized: true,
        reason: "unrecognizedInitialization",
      };
    }
    const snapshot = createBattleSessionSnapshot(
      deps.createSessionId(),
      roundType,
      BattleSessionIdentitySource.INITIALIZATION_LOG
    );
    if (!writeBattleSession(snapshot, deps)) {
      return { ok: false, mode: "unknown", initialized: true, reason: "sessionPersistenceFailed" };
    }
    return { ok: true, mode: "started", initialized: true, snapshot };
  }
  const current = readBattleSession(deps);
  if (current.snapshot?.phase === BattleSessionPhase.ACTIVE) {
    return { ok: true, mode: "resumed", initialized: false, snapshot: current.snapshot };
  }
  return {
    ok: false,
    mode: "unknown",
    initialized: false,
    reason:
      current.snapshot?.phase === BattleSessionPhase.TERMINAL ? "terminalSession" : current.kind,
  };
}

export function recordSessionProgress(event, deps, fromStart = false) {
  const current = readBattleSession(deps).snapshot;
  if (!current) return null;
  const progress = fromStart
    ? readStartProgress(event.initializingText, current.identity.roundType)
    : event;
  const snapshot = recordBattleSessionProgress(current, progress.roundNow, progress.roundAll);
  if (!snapshot || !writeBattleSession(snapshot, deps)) return null;
  return snapshot.progress;
}

export function readBattleSessionContext(deps) {
  const snapshot = readBattleSession(deps).snapshot;
  if (!snapshot) return null;
  return {
    sessionId: snapshot.sessionId,
    sessionPhase: snapshot.phase,
    roundType: snapshot.identity.roundType,
    roundNow: snapshot.progress.roundNow,
    roundAll: snapshot.progress.roundAll,
  };
}

export function terminateBattleSession(event, deps) {
  const snapshot = markBattleSessionTerminal(readBattleSession(deps).snapshot, event.outcome);
  if (!snapshot) return { ok: false, reason: "activeSessionMissing", snapshot: null };
  if (!writeBattleSession(snapshot, deps)) {
    return { ok: false, reason: "sessionPersistenceFailed", snapshot };
  }
  return { ok: true, snapshot };
}
