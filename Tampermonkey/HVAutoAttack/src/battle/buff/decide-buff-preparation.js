import { decideBuff } from "./decide-buff.js";
import { decideChannel } from "./decide-channel.js";
import { decideInfusion } from "./decide-infusion.js";
import { buffFacts, channelFacts, infusionFacts } from "./buff-facts.js";

const EVENT_DECIDE = "decide";

export const BattleBuffPreparationEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

function decideBuffPreparationResult(snap = {}, opt = {}) {
  const event = {
    opt,
    ...infusionFacts(snap),
    ...channelFacts(snap),
    ...buffFacts(snap),
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
  if (event.type === EVENT_DECIDE) return decideBuffPreparationResult(event.snap, event.opt);
  return { kind: "noop" };
}
