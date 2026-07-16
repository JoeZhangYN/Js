import { executeEncounterGenerationRequest } from "./encounter-generation-request.js";
import { EncounterGenerationApplication } from "./encounter-entry-state.js";
import { isBlockingEncounterGenerationResult } from "./encounter-generation-result.js";
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
  const attemptClock = runEncounterPolicy({
    type: EncounterPolicyEvent.READ_CLOCK,
    state: current,
    nowMs,
  });
  const application = runEncounterPolicy({
    type: EncounterPolicyEvent.APPLY_GENERATION_RESULT,
    state: current,
    result: event.result,
    nowMs,
    attemptKey: attemptClock.attemptKey,
  });
  const { result } = application;
  let { state } = application;
  if (application.application === EncounterGenerationApplication.GENERATION_FAULT) {
    state = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_GENERATION_FAILED,
      state,
      attemptKey: attemptClock.attemptKey,
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
    attemptKey: attemptClock.attemptKey,
    blocked:
      !persisted ||
      isBlockingEncounterGenerationResult(result) ||
      recovery.recoveryReason === "generationCircuitOpen",
    application: application.application,
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
