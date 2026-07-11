import {
  createHvutAbilityPageDefinition,
  HvutAbilityCatalogEvidence,
  HvutAbilityWorld,
} from "./hvut-ability-catalog.js";

const bridge = Object.freeze({
  createDefinition: createHvutAbilityPageDefinition,
  evidence: HvutAbilityCatalogEvidence,
  world: HvutAbilityWorld,
});

Object.defineProperty(window, "HVAA_hvutAbilityCatalog", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: bridge,
});
