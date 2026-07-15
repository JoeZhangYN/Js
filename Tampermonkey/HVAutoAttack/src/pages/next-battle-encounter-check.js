import { EncounterEvent, runEncounterAutomation } from "./encounter.js";
import { createEncounterDegradedOutcome } from "./encounter-lobby-outcome.js";
import { isAutomaticEncounterEnabled } from "./encounter-option-gate.js";

export function createNextBattleEncounterCheck({ randomEncounter, onFailure }) {
  return async function checkEncounter(nowMs) {
    if (!randomEncounter || !isAutomaticEncounterEnabled()) return undefined;
    try {
      return await runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK, nowMs });
    } catch (error) {
      onFailure("encounter", error);
      return createEncounterDegradedOutcome({ reason: "encounterRejected", error }, Date.now());
    }
  };
}
