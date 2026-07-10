import { createUtilitySkillSamples, normalizeUtilityStyleState } from "./utility-weight-model.js";
import { buildUtilityShadowProposal } from "./utility-weight-evaluation.js";
import {
  createUtilityActionPending,
  settleUtilityActionObservation,
} from "./utility-weight-observation.js";
import {
  createUtilityActiveBattle,
  isUtilityAdverseType,
  settleUtilityBattle,
  utilityBattleHasAdverse,
} from "./utility-weight-battle-evaluation.js";

const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_RECORD_PHYSICAL_CAST = "recordPhysicalCast";
const EVENT_FINALIZE_PHYSICAL_ACTION = "finalizePhysicalAction";
const EVENT_RECORD_POTION_USE = "recordPotionUse";
const EVENT_RECORD_ADVERSE = "recordAdverse";
const EVENT_BATTLE_COMPLETED = "battleCompleted";

export const UtilityWeightTransitionEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  RECORD_PHYSICAL_CAST: EVENT_RECORD_PHYSICAL_CAST,
  FINALIZE_PHYSICAL_ACTION: EVENT_FINALIZE_PHYSICAL_ACTION,
  RECORD_POTION_USE: EVENT_RECORD_POTION_USE,
  RECORD_ADVERSE: EVENT_RECORD_ADVERSE,
  BATTLE_COMPLETED: EVENT_BATTLE_COMPLETED,
});

function ensureActiveBattle(state, globalTurn) {
  state.activeBattle ||= createUtilityActiveBattle(globalTurn);
  return state.activeBattle;
}

function maybeCreateShadow(state) {
  if (state.candidate || state.shadow) return;
  const proposal = buildUtilityShadowProposal(state.samples, state.multipliers);
  if (!proposal.ready) return;
  state.samples = createUtilitySkillSamples();
  if (!proposal.changed) return;
  state.shadow = {
    multipliers: proposal.multipliers,
    means: proposal.means,
    benchmark: proposal.benchmark,
  };
  state.lastDecision = { kind: "shadowReady", multipliers: proposal.multipliers };
}

function recordBattleStarted(state, event) {
  if (state.activeBattle && utilityBattleHasAdverse(state.activeBattle)) {
    settleUtilityBattle(state, event.globalTurn, "aborted");
  }
  state.activeBattle = createUtilityActiveBattle(event.globalTurn);
  state.pendingAction = null;
}

function recordPhysicalCast(state, event) {
  state.pendingAction = createUtilityActionPending(event);
  ensureActiveBattle(state, event.globalTurn);
}

function finalizePhysicalAction(state, event) {
  const pending = state.pendingAction;
  state.pendingAction = null;
  const observation = settleUtilityActionObservation(pending, event.view);
  if (!observation) return;
  const active = ensureActiveBattle(state, pending.firedGlobalTurn);
  active.oc += observation.ocCost;
  active.progress += observation.progress;
  if (!state.candidate && !state.shadow) {
    const sample = state.samples[observation.code];
    sample.count += 1;
    sample.efficiencySum += observation.resourceEfficiency;
    maybeCreateShadow(state);
  }
}

function recordPotionUse(state, event) {
  ensureActiveBattle(state, event.globalTurn).potions += 1;
}

function recordAdverse(state, event) {
  if (!isUtilityAdverseType(event.adverseType)) return;
  ensureActiveBattle(state, event.globalTurn)[event.adverseType] += 1;
}

function recordBattleCompleted(state, event) {
  ensureActiveBattle(state, event.globalTurn);
  settleUtilityBattle(state, event.globalTurn, event.outcome);
}

const transitionHandlers = Object.freeze({
  [EVENT_BATTLE_STARTED]: recordBattleStarted,
  [EVENT_RECORD_PHYSICAL_CAST]: recordPhysicalCast,
  [EVENT_FINALIZE_PHYSICAL_ACTION]: finalizePhysicalAction,
  [EVENT_RECORD_POTION_USE]: recordPotionUse,
  [EVENT_RECORD_ADVERSE]: recordAdverse,
  [EVENT_BATTLE_COMPLETED]: recordBattleCompleted,
});

export function applyUtilityWeightTransition(currentState, event) {
  const handler = transitionHandlers[event?.type];
  if (!handler) return { changed: false, state: normalizeUtilityStyleState(currentState) };
  const state = normalizeUtilityStyleState(currentState);
  handler(state, event);
  return { changed: true, state };
}
