import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { executeEncounterEntry } from "./encounter-entry-execution.js";
import { showEncounterGenerationBlock } from "./encounter-generation-block.js";
import { blockActiveEncounterIncident } from "./encounter-lobby-active-block.js";
import {
  EncounterLobbyScheduleEvent,
  runEncounterLobbySchedule,
} from "./encounter-lobby-schedule.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

let pendingLobbyGeneration = null;

function claimLobby() {
  runEncounterLobbySchedule({ type: EncounterLobbyScheduleEvent.CANCEL_NEXT_CHECK });
  return { claimed: true };
}

function waitForNextCheck(state, event) {
  runEncounterLobbySchedule({
    type: EncounterLobbyScheduleEvent.SCHEDULE_NEXT_CHECK,
    state,
    rerun: event.rerun,
  });
  return { claimed: false };
}

function planStoredEncounterEntry(state, event) {
  return runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state,
    isIsekai: Boolean(event?.isIsekai),
  });
}

function enterPlannedEncounter(plan) {
  const outcome = executeEncounterEntry(plan);
  return outcome?.handled || outcome?.blocked ? outcome : undefined;
}

function blockEncounterEntry(outcome, source) {
  return showEncounterGenerationBlock(
    {
      status: "persistenceFailed",
      reason: outcome.reason,
      state: outcome.state,
      persistence: outcome.persistence || outcome.rollback?.persistence,
      blocked: true,
    },
    source
  );
}

function claimEnteredEncounter(outcome) {
  if (outcome?.action !== "navigated" || !outcome?.state?.key) return undefined;
  claimLobby();
  return { ...outcome, claimed: true };
}

function readEncounterSnapshot() {
  return runEncounterStateAutomation({ type: EncounterStateEvent.READ_SNAPSHOT });
}

async function loadAndEnterEncounter(plan, event) {
  if (plan?.action !== "generate") return { status: "notRequested", state: plan?.state };
  const generation = await runEncounterStateAutomation({
    type: EncounterStateEvent.LOAD_KEY,
    request: plan.request,
    state: plan.state,
    source: "lobbyGenerationRequest",
    nowMs: event.nowMs,
  });
  if (generation.status !== "available") return generation;
  return {
    ...generation,
    entry: enterPlannedEncounter(planStoredEncounterEntry(generation.state, event)),
  };
}

function finishLobbyGeneration(generation, event) {
  if (generation.entry?.blocked) return blockEncounterEntry(generation.entry, "lobbyEntry");
  const entered = claimEnteredEncounter(generation.entry);
  if (entered) return entered;
  if (generation.blocked) return showEncounterGenerationBlock(generation, "lobby");
  return {
    ...waitForNextCheck(generation.state, event),
    generation,
  };
}

function continueAfterLoadedEncounter(event, plan) {
  if (pendingLobbyGeneration) return pendingLobbyGeneration;
  pendingLobbyGeneration = loadAndEnterEncounter(plan, event)
    .then((generation) => finishLobbyGeneration(generation, event))
    .finally(() => {
      pendingLobbyGeneration = null;
    });
  return pendingLobbyGeneration;
}

export function runEncounterLobbyFlow(event) {
  const snapshot = readEncounterSnapshot();
  if (!snapshot?.ok) {
    return showEncounterGenerationBlock(
      {
        status: "persistenceFailed",
        reason: snapshot?.reason || "encounterStateReadFailed",
        state: snapshot?.state,
        persistence: snapshot,
        blocked: true,
      },
      "lobbyState"
    );
  }
  const state = snapshot.state;
  const clock = runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state });
  const activeBlock = blockActiveEncounterIncident(clock, state);
  if (activeBlock) return activeBlock;
  if (clock.reason === "generationCircuitOpen") {
    return showEncounterGenerationBlock(
      {
        status: "unavailable",
        reason: state.generationFailureReason,
        state,
        recovery: clock,
        blocked: true,
      },
      "lobbyResume"
    );
  }
  if (clock.status === "countdown") return waitForNextCheck(state, event);
  const plan = planStoredEncounterEntry(state, event);
  const entry = enterPlannedEncounter(plan);
  if (entry?.blocked) return blockEncounterEntry(entry, "lobbyEntry");
  const entered = claimEnteredEncounter(entry);
  if (entered) return entered;
  if (runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_BATTLE })) {
    runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY });
    return claimLobby();
  }
  return continueAfterLoadedEncounter(event, plan);
}
