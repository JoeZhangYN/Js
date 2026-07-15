import { IdleArenaClaimKind } from "./next-battle-policy.js";

export const NextBattleArbitrationStatus = Object.freeze({
  SCHEDULED: "scheduled",
  ENCOUNTER_CLAIMED: "encounterClaimed",
  IDLE_ARENA_START_REQUESTED: "idleArenaStartRequested",
  STAMINA_RECOVERY_REQUESTED: "staminaRecoveryRequested",
  BLOCKED: "blocked",
  INACTIVE: "inactive",
  UNKNOWN: "unknown",
});

export function createIdleArenaRequestOutcome(encounter, idleArena, claim) {
  return {
    status:
      claim === IdleArenaClaimKind.BATTLE_REQUESTED
        ? NextBattleArbitrationStatus.IDLE_ARENA_START_REQUESTED
        : NextBattleArbitrationStatus.STAMINA_RECOVERY_REQUESTED,
    reason: idleArena.reason || "idleArenaAccepted",
    encounter,
    idleArena,
  };
}

export function createIdleArenaUnavailableOutcome(encounter, idleArena, retry, scheduled) {
  return {
    status: scheduled
      ? NextBattleArbitrationStatus.SCHEDULED
      : idleArena?.status === "unavailable"
        ? NextBattleArbitrationStatus.INACTIVE
        : NextBattleArbitrationStatus.UNKNOWN,
    reason: scheduled ? retry.reason : idleArena?.reason || "idleArenaUnknown",
    encounter,
    idleArena,
    ...(scheduled ? { next: { owner: retry.owner, deadlineMs: retry.deadlineMs } } : {}),
  };
}
