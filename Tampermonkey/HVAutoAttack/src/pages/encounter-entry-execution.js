import {
  NavigationEvent,
  NavigationRedirectReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

function markEncounterAttempted(outcome) {
  const key = outcome?.state?.key;
  if (!key) return outcome?.state;
  return runEncounterStateAutomation({
    type: EncounterStateEvent.MARK_ATTEMPTED,
    key,
    state: outcome.state,
  });
}

export function executeEncounterEntry(outcome) {
  if (outcome?.action === "enter" || outcome?.action === "navigate") {
    const attemptedState = markEncounterAttempted(outcome);
    runNavigationAutomation({
      type: NavigationEvent.OPEN_URL,
      reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
      url: outcome.href,
    });
    return {
      ...outcome,
      action: "navigated",
      handled: true,
      state: attemptedState || outcome.state,
    };
  }
  if (outcome?.action === "open") {
    const attemptedState = markEncounterAttempted(outcome);
    runNavigationAutomation({
      type: NavigationEvent.OPEN_URL,
      reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
      url: outcome.href,
      newTab: true,
    });
    return { ...outcome, action: "opened", handled: true, state: attemptedState || outcome.state };
  }
  return outcome;
}
