import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { getValue, setValue } from "./storage.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "./cd-tracker.js";
import {
  createUtilityStyleState,
  DEFAULT_UTILITY_MULTIPLIERS,
  readUtilityStyleState,
  writeUtilityStyleState,
} from "./utility-weight-model.js";
import {
  applyUtilityWeightTransition,
  UtilityWeightTransitionEvent,
} from "./utility-weight-transitions.js";
import {
  recordUtilityWeightDecision,
  recordUtilityWeightFailure,
} from "./utility-weight-evidence.js";
import {
  persistUtilityWeightDocument,
  readUtilityWeightDocument,
  readUtilityWeightPolicy,
} from "./utility-weight-persistence.js";

const EVENT_READ_MULTIPLIERS = "readMultipliers";
const EVENT_READ_STATUS = "readStatus";
const EVENT_RESET = "reset";

export const UtilityWeightLearningEvent = Object.freeze({
  READ_MULTIPLIERS: EVENT_READ_MULTIPLIERS,
  READ_STATUS: EVENT_READ_STATUS,
  RESET: EVENT_RESET,
  ...UtilityWeightTransitionEvent,
});

export {
  UTILITY_WEIGHT_FAILURE_KEY,
  UTILITY_WEIGHT_DECISION_KEY,
} from "./utility-weight-evidence.js";

function statusResult(deps, policy, state) {
  return {
    auditIdentity: deps.auditIdentity,
    enabled: policy.enabled,
    fightingStyle: policy.fightingStyle,
    ...state,
  };
}

function handleRead(event, storage, deps, policy) {
  if (event.type === EVENT_READ_MULTIPLIERS && !policy.enabled) {
    return { ...DEFAULT_UTILITY_MULTIPLIERS };
  }
  const documentValue = readUtilityWeightDocument(storage, deps, policy);
  const state = readUtilityStyleState(documentValue, policy.fightingStyle);
  if (event.type === EVENT_READ_MULTIPLIERS) return { ...state.multipliers };
  return statusResult(deps, policy, state);
}

function handleReset(storage, deps, policy) {
  const documentValue = readUtilityWeightDocument(storage, deps, policy);
  const next = writeUtilityStyleState(
    documentValue,
    policy.fightingStyle,
    createUtilityStyleState()
  );
  return persistUtilityWeightDocument(storage, deps, policy, next)
    ? { kind: "reset", fightingStyle: policy.fightingStyle }
    : { kind: "failed", reason: "storageWriteFailed" };
}

function handleTransition(event, storage, deps, policy) {
  if (!policy.enabled) return { kind: "skipped", reason: "utilityWeightLearningDisabled" };
  const documentValue = readUtilityWeightDocument(storage, deps, policy);
  const previous = readUtilityStyleState(documentValue, policy.fightingStyle);
  const transition = applyUtilityWeightTransition(previous, {
    ...event,
    globalTurn: event.globalTurn ?? deps.readGlobalTurn(),
  });
  if (!transition.changed) return { kind: "rejected", reason: "unknownUtilityWeightEvent" };
  const nextDocument = writeUtilityStyleState(
    documentValue,
    policy.fightingStyle,
    transition.state
  );
  if (!persistUtilityWeightDocument(storage, deps, policy, nextDocument)) {
    return { kind: "failed", reason: "storageWriteFailed" };
  }
  if (
    transition.state.lastDecision &&
    JSON.stringify(transition.state.lastDecision) !== JSON.stringify(previous.lastDecision)
  ) {
    deps.recordDecision({
      auditIdentity: deps.auditIdentity,
      fightingStyle: policy.fightingStyle,
      decision: transition.state.lastDecision,
    });
  }
  return { kind: "recorded" };
}

export function createUtilityWeightLearningCapability(storage, ports = {}) {
  const deps = {
    auditIdentity: ports.auditIdentity || "unknown",
    readGlobalTurn:
      ports.readGlobalTurn ||
      (() => runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_GLOBAL_TURN })),
    readOptionField:
      ports.readOptionField ||
      ((key, fallback) => runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback })),
    recordDecision: ports.recordDecision || recordUtilityWeightDecision,
    recordFailure: ports.recordFailure || recordUtilityWeightFailure,
  };

  function runSafely(event) {
    try {
      const policy = readUtilityWeightPolicy(deps);
      if (event?.type === EVENT_READ_MULTIPLIERS || event?.type === EVENT_READ_STATUS) {
        return handleRead(event, storage, deps, policy);
      }
      if (event?.type === EVENT_RESET) return handleReset(storage, deps, policy);
      return handleTransition(event || {}, storage, deps, policy);
    } catch (error) {
      try {
        deps.recordFailure("run", {
          auditIdentity: deps.auditIdentity,
          error: error?.message || String(error),
        });
      } catch {
        // Learning diagnostics must not affect battle execution.
      }
      return { kind: "failed", reason: "utilityWeightLearningThrew" };
    }
  }

  return Object.freeze({
    run: (event = { type: EVENT_READ_MULTIPLIERS }) => runSafely(event),
  });
}

const currentUtilityWeightLearning = createUtilityWeightLearningCapability(
  { getValue, setValue },
  { auditIdentity: CURRENT_WORLD_POLICY.auditIdentity }
);

export function runUtilityWeightLearning(event = { type: EVENT_READ_MULTIPLIERS }) {
  return currentUtilityWeightLearning.run(event);
}
