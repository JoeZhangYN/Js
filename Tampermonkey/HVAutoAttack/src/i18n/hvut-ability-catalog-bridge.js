import {
  createHvutAbilityCatalog,
  HvutAbilityCatalogEvidence,
  HvutAbilityWorld,
} from "./hvut-ability-catalog.js";

const bridge = Object.freeze({
  create: createHvutAbilityCatalog,
  evidence: HvutAbilityCatalogEvidence,
  world: HvutAbilityWorld,
});

Object.defineProperty(window, "HVAA_hvutAbilityCatalog", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: bridge,
});
