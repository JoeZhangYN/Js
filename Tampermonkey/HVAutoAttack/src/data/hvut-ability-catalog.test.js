import { describe, expect, it } from "vitest";
import {
  createHvutAbilityPageDefinition,
  HvutAbilityCatalogEvidence,
  HvutAbilityWorld,
} from "../i18n/hvut-ability-catalog.js";
import { HvutAbilityRequirementCatalog } from "./hvut-ability-requirements.js";

describe("HVUT ability catalog authority", () => {
  it("publishes one complete current requirement catalog", () => {
    expect(Object.keys(HvutAbilityRequirementCatalog)).toHaveLength(75);
    expect(HvutAbilityRequirementCatalog["2H Parry"]).toEqual({
      unlock: [50, 200],
      point: [2, 3],
    });
    expect(HvutAbilityRequirementCatalog["Staff Accuracy"]).toEqual({
      unlock: [50, 150, 300],
      point: [1, 2, 3],
    });
    expect(HvutAbilityRequirementCatalog["Cloth Spellacc"]).toEqual({
      unlock: [0, 120, 240],
      point: [2, 3, 5],
    });
    expect(HvutAbilityCatalogEvidence).toMatchObject({
      reachability: "successful",
      observedFact: { name: "2H Parry", rankCount: 2 },
    });
  });

  it.each([HvutAbilityWorld.ISEKAI, HvutAbilityWorld.PERSISTENT])(
    "hydrates every %s ability through the same requirement authority",
    (world) => {
      const outcome = createHvutAbilityPageDefinition({ world });

      expect(outcome.kind).toBe("accepted");
      expect(Object.keys(outcome.catalog)).toHaveLength(75);
      expect(outcome.catalog["2H Parry"]).toMatchObject({
        unlock: [50, 200],
        point: [2, 3],
      });
      expect(outcome.catalog["2H Parry"].unlock).not.toBe(
        HvutAbilityRequirementCatalog["2H Parry"].unlock
      );
      expect(Object.keys(outcome.presets)).toHaveLength(8);
      expect(outcome.presets["Current Set"]).toEqual([]);
    }
  );

  it("keeps the world-owned control-spell name without forking progression", () => {
    const isekai = createHvutAbilityPageDefinition({ world: HvutAbilityWorld.ISEKAI });
    const persistent = createHvutAbilityPageDefinition({ world: HvutAbilityWorld.PERSISTENT });

    expect(isekai.catalog["Better Immobilize"].point).toEqual([1, 2, 3, 4, 5]);
    expect(isekai.catalog["Better MagNet"]).toBeUndefined();
    expect(persistent.catalog["Better MagNet"].point).toEqual([1, 2, 3, 4, 5]);
    expect(persistent.catalog["Better Immobilize"]).toBeUndefined();
  });

  it("rejects an unknown world before exposing a partial page definition", () => {
    expect(createHvutAbilityPageDefinition({ world: "unknown" })).toMatchObject({
      kind: "rejected",
      reason: "unknownAbilityWorld",
    });
  });

  it("returns fresh mutable runtime state without exposing catalog authority", () => {
    const first = createHvutAbilityPageDefinition({ world: HvutAbilityWorld.ISEKAI });
    const second = createHvutAbilityPageDefinition({ world: HvutAbilityWorld.ISEKAI });

    first.presets["Current Set"].push("HP Tank");
    first.catalog["HP Tank"].level = 3;

    expect(second.presets["Current Set"]).toEqual([]);
    expect(second.catalog["HP Tank"].level).toBeUndefined();
  });
});
