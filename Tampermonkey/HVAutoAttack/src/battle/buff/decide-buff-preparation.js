import { decideBuff } from "./decide-buff.js";
import { decideChannel } from "./decide-channel.js";
import { decideInfusion } from "./decide-infusion.js";
import { buffPreparationFacts } from "./buff-facts.js";

const EVENT_DECIDE = "decide";

export const BattleBuffPreparationEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleBuffPreparationEventHandlers = Object.freeze({
  [EVENT_DECIDE]: (event) => decideBuffPreparationResult(event.snap, event.opt),
});

function decideBuffPreparationResult(snap = {}, opt = {}) {
  const event = {
    opt,
    ...buffPreparationFacts(snap),
  };
  for (const decide of [decideInfusion, decideChannel, decideBuff]) {
    const result = decide(event);
    if (!isEmptyDecision(result)) return result;
  }
  return { kind: "noop" };
}

function isEmptyDecision(result) {
  if (result.kind === "noop") return true;
  return result.kind === "channel-plan" && result.plan?.type === "noop";
}

export function runBattleBuffPreparation(event = { type: EVENT_DECIDE }) {
  return battleBuffPreparationEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
