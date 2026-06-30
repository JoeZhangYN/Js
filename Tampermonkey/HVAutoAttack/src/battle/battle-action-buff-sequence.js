import { decideInfusion } from "./buff/decide-infusion.js";
import { decideBuff } from "./buff/decide-buff.js";
import { decideChannel } from "./buff/decide-channel.js";
import { buffFacts, channelFacts, infusionFacts } from "./buff/buff-facts.js";

export function buffPreparationActionRules() {
  return [
    {
      name: "useInfusions",
      decide: (snap, opt) => decideInfusion({ opt, ...infusionFacts(snap) }),
    },
    {
      name: "useChannelSkill",
      decide: (snap, opt) => decideChannel({ opt, ...channelFacts(snap) }),
    },
    {
      name: "useBuffSkill",
      decide: (snap, opt) => decideBuff({ opt, ...buffFacts(snap) }),
    },
  ];
}
