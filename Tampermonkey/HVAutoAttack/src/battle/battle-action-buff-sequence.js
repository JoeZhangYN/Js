import { decideBuffPreparation } from "./buff/decide-buff-preparation.js";
import { buffFacts, channelFacts, infusionFacts } from "./buff/buff-facts.js";

export function buffPreparationActionRules() {
  return [
    {
      name: "prepareBuffs",
      decide: (snap, opt) =>
        decideBuffPreparation({
          opt,
          ...infusionFacts(snap),
          ...channelFacts(snap),
          ...buffFacts(snap),
        }),
    },
  ];
}
