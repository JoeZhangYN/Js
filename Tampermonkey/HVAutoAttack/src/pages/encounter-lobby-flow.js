import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { recordEncounterLobbyDegradation } from "./encounter-generation-block.js";
import { EncounterCheckMode } from "./encounter-check-mode.js";
import {
  blockActiveEncounterIncident,
  createActiveEncounterBlockOutcome,
} from "./encounter-lobby-active-block.js";
import { resolveEncounterLobbyCircuitResponse } from "./encounter-lobby-circuit-response.js";
import {
  enterPlannedEncounter,
  planStoredEncounterEntry,
  recordEncounterEntryDegradation,
} from "./encounter-lobby-entry.js";
import {
  createEncounterDegradedOutcome,
  createEncounterClaimedOutcome,
  createEncounterClockOutcome,
  createEnteredEncounterOutcome,
} from "./encounter-lobby-outcome.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

let pendingLobbyGeneration = null;

const nowFor = (event) => event.nowMs ?? Date.now();

const readEncounterSnapshot = () =>
  runEncounterStateAutomation({ type: EncounterStateEvent.READ_SNAPSHOT });

async function loadAndEnterEncounter(plan, event) {
  if (plan?.action !== "generate") return { status: "notRequested", state: plan?.state };
  const generation = await runEncounterStateAutomation({
    type: EncounterStateEvent.LOAD_KEY,
    request: plan.request,
    state: plan.state,
    source: "lobbyGenerationRequest",
    checkMode: EncounterCheckMode.AUTOMATIC,
    nowMs: event.nowMs,
  });
  if (generation.status !== "available") return generation;
  return {
    ...generation,
    entry: enterPlannedEncounter(planStoredEncounterEntry(generation.state)),
  };
}

function finishLobbyGeneration(generation, event) {
  const nowMs = nowFor(event);
  if (generation.entry?.blocked) {
    const diagnostic = recordEncounterEntryDegradation(generation.entry, "lobbyEntry");
    return createEncounterDegradedOutcome(
      {
        reason: generation.entry.reason,
        state: generation.entry.state,
        diagnostic,
        generation,
      },
      nowMs
    );
  }
  const entered = createEnteredEncounterOutcome(generation.entry);
  if (entered) return entered;
  const clock = runEncounterPolicy({
    type: EncounterPolicyEvent.READ_CLOCK,
    state: generation.state,
    nowMs,
  });
  if (generation.blocked) {
    return recordEncounterLobbyDegradation(generation, "lobby", clock, nowMs, { generation });
  }
  return createEncounterClockOutcome(clock, generation.state, { generation }, nowMs);
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

export function runEncounterLobbyFlow(event = {}) {
  const nowMs = nowFor(event);
  const snapshot = readEncounterSnapshot();
  if (!snapshot?.ok) {
    const generation = {
      status: "persistenceFailed",
      reason: snapshot?.reason || "encounterStateReadFailed",
      state: snapshot?.state,
      persistence: snapshot,
      blocked: true,
    };
    return recordEncounterLobbyDegradation(generation, "lobbyState", undefined, nowMs);
  }
  let state = snapshot.state;
  let clock = runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state, nowMs });
  const activeBlock = blockActiveEncounterIncident(clock, state, {
    persistState: (recoveryState) =>
      runEncounterStateAutomation({
        type: EncounterStateEvent.RESTORE_ENTRY,
        state: recoveryState,
      }),
  });
  if (activeBlock?.status === "blocked") {
    return createActiveEncounterBlockOutcome(activeBlock, clock, nowMs);
  }
  if (activeBlock?.status === "recovered") {
    state = activeBlock.state;
    clock = runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state, nowMs });
  }
  const circuit = resolveEncounterLobbyCircuitResponse(clock, state, {
    nowMs,
    random: event.random,
  });
  if (!circuit.ok) {
    return recordEncounterLobbyDegradation(
      circuit.generation,
      "lobbyCircuitResponse",
      clock,
      nowMs
    );
  }
  state = circuit.state;
  clock = circuit.clock;
  if (clock.recoveryReason === "generationCircuitOpen") {
    const generation = {
      status: "unavailable",
      reason: state.generationFailureReason,
      state,
      recovery: clock,
      blocked: true,
    };
    return recordEncounterLobbyDegradation(generation, "lobbyResume", clock, nowMs);
  }
  if (clock.status === "countdown") {
    return createEncounterClockOutcome(clock, state, undefined, nowMs);
  }
  const plan = planStoredEncounterEntry(state);
  const entry = enterPlannedEncounter(plan);
  if (entry?.blocked) {
    const diagnostic = recordEncounterEntryDegradation(entry, "lobbyEntry");
    return createEncounterDegradedOutcome(
      { reason: entry.reason, state: entry.state, clock, diagnostic, entry },
      nowMs
    );
  }
  const entered = createEnteredEncounterOutcome(entry);
  if (entered) return entered;
  if (runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_BATTLE })) {
    runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY });
    return createEncounterClaimedOutcome("staminaRecovery", state);
  }
  return continueAfterLoadedEncounter(event, plan);
}
