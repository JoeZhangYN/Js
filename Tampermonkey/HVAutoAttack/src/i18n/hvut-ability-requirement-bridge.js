import {
  decideHvutAbilityRankRequirement,
  HvutAbilityRankAction,
  HvutAbilityRequirementLayout,
  HvutAbilityRankState,
} from "./hvut-ability-requirement.js";

const bridge = Object.freeze({
  decide: decideHvutAbilityRankRequirement,
  action: HvutAbilityRankAction,
  layout: HvutAbilityRequirementLayout,
  state: HvutAbilityRankState,
});

Object.defineProperty(window, "HVAA_hvutAbilityRequirement", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: bridge,
});
