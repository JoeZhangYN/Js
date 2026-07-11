import {
  decideHvutAbilityRankRequirement,
  HvutAbilityRankAction,
  HvutAbilityRequirementLayout,
  HvutAbilityRankState,
} from "./hvut-ability-requirement.js";
import {
  decideHvutAbilityPointContrast,
  HvutAbilityPointTone,
} from "./hvut-ability-background-contrast.js";

const bridge = Object.freeze({
  decide: decideHvutAbilityRankRequirement,
  action: HvutAbilityRankAction,
  contrast: decideHvutAbilityPointContrast,
  layout: HvutAbilityRequirementLayout,
  state: HvutAbilityRankState,
  tone: HvutAbilityPointTone,
});

Object.defineProperty(window, "HVAA_hvutAbilityRequirement", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: bridge,
});
