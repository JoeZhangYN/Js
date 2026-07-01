import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";

const REASON_ACTION_EFFECT_DISPATCH_THROW = "actionEffectDispatchThrew";

export function applyActionResultStep(result, snap) {
  try {
    return {
      acted: Boolean(
        runBattleActionEffectDispatch({
          type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
          result,
          snap,
        })
      ),
    };
  } catch (error) {
    return {
      acted: false,
      effectEvidence: {
        result: {
          kind: "effect-dispatch-event",
          reason: REASON_ACTION_EFFECT_DISPATCH_THROW,
          originalResultKind: result?.kind ?? null,
          error: error?.message || String(error),
        },
        acted: false,
        knownResultKind: false,
        failureReason: REASON_ACTION_EFFECT_DISPATCH_THROW,
      },
    };
  }
}
