import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { showEncounterGenerationBlock } from "./encounter-generation-block.js";
import { blockActiveEncounterIncident } from "./encounter-lobby-active-block.js";
import {
  blockEncounterEntry,
  enterPlannedEncounter,
  planStoredEncounterEntry,
} from "./encounter-lobby-entry.js";
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
  const scheduled = runEncounterLobbySchedule({
    type: EncounterLobbyScheduleEvent.SCHEDULE_NEXT_CHECK,
    state,
    rerun: event.rerun,
  });
  return { claimed: false, scheduled };
}

function scheduleBlockedOutcome(outcome, state, event) {
  if (!state) return outcome;
  return { ...outcome, retry: waitForNextCheck(state, event) };
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
  if (generation.entry?.blocked)
    return scheduleBlockedOutcome(
      blockEncounterEntry(generation.entry, "lobbyEntry"),
      generation.entry.state,
      event
    );
  const entered = claimEnteredEncounter(generation.entry);
  if (entered) return entered;
  if (generation.blocked)
    return scheduleBlockedOutcome(
      showEncounterGenerationBlock(generation, "lobby"),
      generation.state,
      event
    );
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
    return scheduleBlockedOutcome(
      showEncounterGenerationBlock(
        {
          status: "persistenceFailed",
          reason: snapshot?.reason || "encounterStateReadFailed",
          state: snapshot?.state,
          persistence: snapshot,
          blocked: true,
        },
        "lobbyState"
      ),
      snapshot?.state,
      event
    );
  }
  let state = snapshot.state;
  let clock = runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state });
  const activeBlock = blockActiveEncounterIncident(clock, state, {
    persistState: (recoveryState) =>
      runEncounterStateAutomation({
        type: EncounterStateEvent.RESTORE_ENTRY,
        state: recoveryState,
      }),
  });
  if (activeBlock?.status === "blocked") {
    return scheduleBlockedOutcome(activeBlock.outcome, activeBlock.state, event);
  }
  if (activeBlock?.status === "recovered") {
    state = activeBlock.state;
    clock = runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state });
  }
  if (clock.reason === "generationCircuitOpen") {
    return scheduleBlockedOutcome(
      showEncounterGenerationBlock(
        {
          status: "unavailable",
          reason: state.generationFailureReason,
          state,
          recovery: clock,
          blocked: true,
        },
        "lobbyResume"
      ),
      state,
      event
    );
  }
  if (clock.status === "countdown") return waitForNextCheck(state, event);
  const plan = planStoredEncounterEntry(state, event);
  const entry = enterPlannedEncounter(plan);
  if (entry?.blocked)
    return scheduleBlockedOutcome(blockEncounterEntry(entry, "lobbyEntry"), entry.state, event);
  const entered = claimEnteredEncounter(entry);
  if (entered) return entered;
  if (runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_BATTLE })) {
    runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY });
    return claimLobby();
  }
  return continueAfterLoadedEncounter(event, plan);
}
