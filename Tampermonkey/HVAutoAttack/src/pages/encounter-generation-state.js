import { executeEncounterGenerationRequest } from "./encounter-generation-request.js";
import {
  EncounterGenerationFailureReason,
  EncounterGenerationResultStatus,
  isBlockingEncounterGenerationResult,
} from "./encounter-generation-result.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const EVENT_RECORD_RESULT = "recordResult";
const EVENT_LOAD = "load";

export const EncounterGenerationStateEvent = Object.freeze({
  RECORD_RESULT: EVENT_RECORD_RESULT,
  LOAD: EVENT_LOAD,
});

function recordResult(event, deps) {
  const nowMs = event.nowMs ?? Date.now();
  const snapshot = event.state
    ? { ok: true, state: event.state }
    : event.stateSnapshot || deps.readState();
  if (!snapshot?.ok) {
    return {
      status: "persistenceFailed",
      reason: "generationStateReadFailed",
      result: event.result,
      request: event.request,
      source: event.source,
      state: snapshot?.state,
      persistence: snapshot,
      persisted: false,
      blocked: true,
    };
  }
  const current = snapshot.state;
  let result = event.result;
  let state = current;
  if (result.status === EncounterGenerationResultStatus.AVAILABLE) {
    state = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_KEY_AVAILABLE,
      state: current,
      key: result.key,
      nowMs,
    });
    if (state.clear) {
      result = {
        status: EncounterGenerationResultStatus.UNAVAILABLE,
        reason: EncounterGenerationFailureReason.ENCOUNTER_KEY_ALREADY_ATTEMPTED,
        key: result.key,
      };
    }
  }
  if (result.status !== EncounterGenerationResultStatus.AVAILABLE) {
    const clock = runEncounterPolicy({
      type: EncounterPolicyEvent.READ_CLOCK,
      state,
      nowMs,
    });
    state = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED,
      state: clock.state,
      attemptKey: clock.attemptKey,
      reason: result.reason,
      nowMs,
    });
  }
  const persistence = deps.writeState(state);
  const sharedRequired = event.source?.pageKind === "ehentai";
  const persisted =
    persistence?.ok === true && (!sharedRequired || persistence.scope === "crossOrigin");
  const recovery = runEncounterPolicy({
    type: EncounterPolicyEvent.READ_CLOCK,
    state,
    nowMs,
  });
  return {
    status: persisted ? result.status : "persistenceFailed",
    reason: persisted ? result.reason : "generationStatePersistenceFailed",
    result,
    request: event.request,
    source: event.source,
    state,
    persistence,
    persisted,
    recovery,
    blocked:
      !persisted ||
      isBlockingEncounterGenerationResult(result) ||
      recovery.reason === "generationCircuitOpen",
  };
}

export function runEncounterGenerationState(event, deps) {
  if (event?.type === EVENT_RECORD_RESULT) return recordResult(event, deps);
  if (event?.type === EVENT_LOAD) {
    return executeEncounterGenerationRequest(event, {
      ...deps,
      recordResult: (resultEvent) => recordResult(resultEvent, deps),
    });
  }
  return undefined;
}
