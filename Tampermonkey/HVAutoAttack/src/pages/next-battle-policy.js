import { IdleArenaStartStatus } from "../arena/idle-arena-outcome.js";
import { EncounterLobbyStatus } from "./encounter-lobby-outcome.js";

export function readEncounterBattleCandidate(outcome, nowMs) {
  if (
    ![
      EncounterLobbyStatus.WAITING,
      EncounterLobbyStatus.DEGRADED,
      EncounterLobbyStatus.STOPPED_FOR_DAY,
    ].includes(outcome?.status)
  ) {
    return undefined;
  }
  const deadlineMs = Number(outcome.resumeAtMs);
  if (!Number.isFinite(deadlineMs) || deadlineMs <= nowMs) return undefined;
  return { owner: "encounter", deadlineMs, reason: outcome.reason };
}

export function chooseNextBattleCandidate(encounter, idle) {
  if (!encounter) return idle;
  if (!idle) return encounter;
  return encounter.deadlineMs <= idle.deadlineMs ? encounter : idle;
}

export const IdleArenaClaimKind = Object.freeze({
  RECOVERY_REQUESTED: "recoveryRequested",
  BATTLE_REQUESTED: "battleRequested",
});

export function readIdleArenaClaim(outcome) {
  if (outcome?.status === IdleArenaStartStatus.RECOVERY_REQUESTED) {
    return IdleArenaClaimKind.RECOVERY_REQUESTED;
  }
  if (outcome?.status === IdleArenaStartStatus.BATTLE_REQUESTED) {
    return IdleArenaClaimKind.BATTLE_REQUESTED;
  }
  return undefined;
}
