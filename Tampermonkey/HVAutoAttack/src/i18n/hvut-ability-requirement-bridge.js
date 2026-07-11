import {
  decideHvutAbilityRankRequirement,
  HvutAbilityRankAction,
  HvutAbilityRankState,
} from "./hvut-ability-requirement.js";

const bridge = Object.freeze({
  decide: decideHvutAbilityRankRequirement,
  action: HvutAbilityRankAction,
  state: HvutAbilityRankState,
});

Object.defineProperty(window, "HVAA_hvutAbilityRequirement", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: bridge,
});
