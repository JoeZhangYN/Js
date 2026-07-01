// 行动效果分发入口：把 PURE ActionResult 翻译为 DOM/command 副作用并返回 acted。
import { executeActionResult, isKnownActionResultKind } from "./battle-action-effect-execution.js";
import { recordActionEffectEvidence } from "./battle-action-effect-recording.js";
import { readBattleCommandEvidence } from "./battle-command-evidence.js";

const EVENT_APPLY_ACTION_RESULT = "applyActionResult";

export const BattleActionEffectDispatchEvent = Object.freeze({
  APPLY_ACTION_RESULT: EVENT_APPLY_ACTION_RESULT,
});

const battleActionEffectDispatchEventHandlers = Object.freeze({
  [EVENT_APPLY_ACTION_RESULT]: (event) => applyActionResult(event.result, event.snap),
});

function applyActionResult(result, snap) {
  const previousCommandEvidence = readCommandEvidenceSafely();
  const execution = executeActionResult(result, snap);
  const freshCommandEvidence = readFreshCommandEvidence(previousCommandEvidence.value);
  recordActionEffectEvidence({
    result,
    acted: execution.acted,
    knownResultKind: isKnownActionResultKind(result?.kind),
    commandEvidence: freshCommandEvidence.value,
    commandEvidenceReadError: previousCommandEvidence.error || freshCommandEvidence.error,
    failureReason: execution.failureReason,
    executionError: execution.error,
  });
  return execution.acted;
}

function readCommandEvidenceSafely() {
  try {
    return { value: readBattleCommandEvidence(), error: undefined };
  } catch (error) {
    return { value: undefined, error: error?.message || String(error) };
  }
}

function readFreshCommandEvidence(previousCommandEvidence) {
  const current = readCommandEvidenceSafely();
  if (current.error) return current;
  const commandEvidence = current.value;
  if (!commandEvidence) return { value: undefined, error: undefined };
  try {
    return {
      value:
        JSON.stringify(commandEvidence) === JSON.stringify(previousCommandEvidence)
          ? undefined
          : commandEvidence,
      error: undefined,
    };
  } catch (error) {
    return { value: commandEvidence, error: error?.message || String(error) };
  }
}

function rejectUnknownActionEffectEvent(event) {
  recordActionEffectEvidence({
    result: {
      kind: "unknown-dispatch-event",
      reason: "unknownActionEffectDispatchEvent",
      eventType: event?.type ?? null,
    },
    acted: false,
    knownResultKind: false,
    failureReason: "unknownActionEffectDispatchEvent",
  });
  return false;
}

export function runBattleActionEffectDispatch(event = { type: EVENT_APPLY_ACTION_RESULT }) {
  return (
    battleActionEffectDispatchEventHandlers[event?.type]?.(event) ??
    rejectUnknownActionEffectEvent(event)
  );
}
