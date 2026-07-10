import { evaluateUtilityCandidate, UTILITY_BATTLE_WINDOW } from "./utility-weight-evaluation.js";

const ADVERSE_TYPES = Object.freeze(["flee", "pause", "recovery"]);

export function createUtilityActiveBattle(globalTurn) {
  return {
    startGlobalTurn: Math.max(0, Number(globalTurn) || 0),
    oc: 0,
    progress: 0,
    potions: 0,
    flee: 0,
    pause: 0,
    recovery: 0,
  };
}

export function utilityBattleHasAdverse(active) {
  return ADVERSE_TYPES.some((key) => (Number(active?.[key]) || 0) > 0);
}

function battleRecord(active, globalTurn, outcome) {
  return {
    oc: Number(active?.oc) || 0,
    progress: Number(active?.progress) || 0,
    potions: Number(active?.potions) || 0,
    turns: Math.max(1, Math.trunc((Number(globalTurn) || 0) - (active?.startGlobalTurn || 0))),
    flee: Number(active?.flee) || 0,
    pause: Number(active?.pause) || 0,
    recovery: Number(active?.recovery) || 0,
    outcome,
  };
}

function maybeApplyShadow(state) {
  if (!state.shadow || state.candidate || state.baselineWindow.length < UTILITY_BATTLE_WINDOW)
    return;
  state.candidate = {
    previousMultipliers: { ...state.multipliers },
    appliedMultipliers: { ...state.shadow.multipliers },
    baseline: [...state.baselineWindow],
    evaluation: [],
  };
  state.multipliers = { ...state.shadow.multipliers };
  state.shadow = null;
  state.lastDecision = { kind: "candidateApplied", multipliers: { ...state.multipliers } };
}

function settleCandidateWindow(state) {
  if (state.candidate.evaluation.length < UTILITY_BATTLE_WINDOW) return;
  const evaluation = evaluateUtilityCandidate(state.candidate.baseline, state.candidate.evaluation);
  if (evaluation.rollback) {
    state.multipliers = { ...state.candidate.previousMultipliers };
    state.baselineWindow = [...state.candidate.baseline];
    state.lastDecision = { kind: "rolledBack", ...evaluation };
  } else {
    state.baselineWindow = [...state.candidate.evaluation];
    state.lastDecision = { kind: "accepted", ...evaluation };
  }
  state.candidate = null;
}

export function settleUtilityBattle(state, globalTurn, outcome) {
  const record = battleRecord(state.activeBattle, globalTurn, outcome);
  if (state.candidate) {
    state.candidate.evaluation.push(record);
    settleCandidateWindow(state);
  } else {
    state.baselineWindow = [...state.baselineWindow, record].slice(-UTILITY_BATTLE_WINDOW);
  }
  state.activeBattle = null;
  state.pendingAction = null;
  maybeApplyShadow(state);
}

export function isUtilityAdverseType(value) {
  return ADVERSE_TYPES.includes(value);
}
