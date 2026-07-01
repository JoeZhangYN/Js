import { BattleTargetCommandEvent, runBattleTargetCommand } from "../battle-target-command.js";
import { recordActionEffectEvidence } from "../battle-action-effect-recording.js";

export function clickMercifulFallbackTarget(plan) {
  try {
    const clicked = !!runBattleTargetCommand({
      type: BattleTargetCommandEvent.CLICK_TARGET,
      targetId: plan.defaultTargetId,
    });
    if (!clicked) recordMercifulFallbackTargetFailure(plan, "mercifulFallbackTargetRejected");
  } catch (error) {
    recordMercifulFallbackTargetFailure(plan, "mercifulFallbackTargetThrew", error);
  }
}

function recordMercifulFallbackTargetFailure(plan, reason, error) {
  recordActionEffectEvidence({
    result: {
      kind: "attack-execution-event",
      reason,
      planType: plan?.type ?? null,
      defaultTargetId: plan?.defaultTargetId ?? null,
      mercifulTargetId: plan?.mercifulTargetId ?? null,
    },
    acted: true,
    knownResultKind: true,
    failureReason: reason,
    ...(error ? { executionError: error?.message || String(error) } : {}),
  });
}
