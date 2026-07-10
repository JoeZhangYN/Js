import {
  NavigationEvent,
  NavigationRedirectReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

function markEncounterAttempted(outcome) {
  const key = outcome?.state?.key;
  if (!key) return { ok: true, state: outcome?.state };
  return runEncounterStateAutomation({
    type: EncounterStateEvent.MARK_ATTEMPTED,
    key,
    state: outcome.state,
  });
}

function restoreEncounterEntry(state) {
  return runEncounterStateAutomation({
    type: EncounterStateEvent.RESTORE_ENTRY,
    state,
  });
}

function prepareEntry(outcome) {
  const prepared = markEncounterAttempted(outcome);
  if (prepared?.ok) return prepared;
  return {
    ...outcome,
    action: "statePersistenceFailed",
    reason: "encounterEntryStatePersistenceFailed",
    handled: false,
    blocked: true,
    persistence: prepared?.persistence,
  };
}

function executeNavigation(outcome, newTab = false) {
  const prepared = prepareEntry(outcome);
  if (prepared.blocked) return prepared;
  const navigated = runNavigationAutomation({
    type: NavigationEvent.OPEN_URL,
    reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
    url: outcome.href,
    ...(newTab ? { newTab: true } : {}),
  });
  if (!navigated) {
    const rollback = restoreEncounterEntry(outcome.state);
    return {
      ...outcome,
      action: "navigationFailed",
      reason: "encounterNavigationRejected",
      handled: false,
      blocked: true,
      state: rollback?.ok ? outcome.state : prepared.state,
      rollback,
    };
  }
  return {
    ...outcome,
    action: newTab ? "opened" : "navigated",
    handled: true,
    state: prepared.state,
    persistence: prepared.persistence,
  };
}

export function executeEncounterEntry(outcome) {
  if (outcome?.action === "enter" || outcome?.action === "navigate") {
    return executeNavigation(outcome);
  }
  if (outcome?.action === "open") {
    return executeNavigation(outcome, true);
  }
  return outcome;
}
