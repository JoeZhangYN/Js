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
    const navigated = runNavigationAutomation({
      type: NavigationEvent.OPEN_URL,
      reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
      url: outcome.href,
    });
    if (!navigated) return { ...outcome, action: "navigationFailed", handled: false };
    const attemptedState = markEncounterAttempted(outcome);
    return {
      ...outcome,
      action: "navigated",
      handled: true,
      state: attemptedState || outcome.state,
    };
  }
  if (outcome?.action === "open") {
    const opened = runNavigationAutomation({
      type: NavigationEvent.OPEN_URL,
      reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
      url: outcome.href,
      newTab: true,
    });
    if (!opened) return { ...outcome, action: "navigationFailed", handled: false };
    const attemptedState = markEncounterAttempted(outcome);
    return { ...outcome, action: "opened", handled: true, state: attemptedState || outcome.state };
  }
  return outcome;
}
