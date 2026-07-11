export const HvutAbilityRankState = Object.freeze({
  ACQUIRED: "acquired",
  UNLOCKABLE: "unlockable",
  LEVEL_LOCKED: "levelLocked",
  UNKNOWN: "unknown",
});

export const HvutAbilityRankAction = Object.freeze({
  NONE: "none",
  UNLOCK: "unlock",
  INSUFFICIENT_POINTS: "insufficientPoints",
});

export const HvutAbilityRequirementLayout = Object.freeze({
  POINTS_CENTER_LEVEL_BELOW: "pointsCenterLevelBelow",
});

const BUTTON_STATE = Object.freeze({
  f: HvutAbilityRankState.ACQUIRED,
  u: HvutAbilityRankState.UNLOCKABLE,
  x: HvutAbilityRankState.LEVEL_LOCKED,
});

function requirementOf(input) {
  const abilityPoints = Number(input?.abilityPoints);
  const playerLevel = Number(input?.requiredPlayerLevel);
  if (!Number.isFinite(abilityPoints) || !Number.isFinite(playerLevel)) return null;
  return Object.freeze({
    abilityPoints,
    playerLevel,
    abilityPointsText: String(abilityPoints),
    playerLevelText: `(${playerLevel})`,
    layout: HvutAbilityRequirementLayout.POINTS_CENTER_LEVEL_BELOW,
  });
}

export function decideHvutAbilityRankRequirement(input) {
  const requirement = requirementOf(input);
  if (!requirement) {
    return Object.freeze({ kind: "rejected", reason: "invalidRequirement" });
  }

  const rankState = BUTTON_STATE[input?.buttonType] || HvutAbilityRankState.UNKNOWN;
  if (rankState === HvutAbilityRankState.UNKNOWN) {
    return Object.freeze({
      kind: "unknownState",
      reason: "unrecognizedButtonType",
      requirement,
      rankState,
      action: HvutAbilityRankAction.NONE,
    });
  }

  const action =
    rankState !== HvutAbilityRankState.UNLOCKABLE
      ? HvutAbilityRankAction.NONE
      : Number(input?.remainingAbilityPoints) >= 0
        ? HvutAbilityRankAction.UNLOCK
        : HvutAbilityRankAction.INSUFFICIENT_POINTS;
  return Object.freeze({ kind: "accepted", requirement, rankState, action });
}
