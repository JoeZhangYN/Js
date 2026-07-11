import { describe, expect, it } from "vitest";
import {
  createHvutAbilityCatalog,
  HvutAbilityCatalogEvidence,
  HvutAbilityWorld,
} from "../i18n/hvut-ability-catalog.js";
import { HvutAbilityRequirementCatalog } from "./hvut-ability-requirements.js";

function presentationFor(world) {
  const entries = Object.keys(HvutAbilityRequirementCatalog).map((name) => [
    name,
    { category: "test", img: "test.png", pos: 0 },
  ]);
  const presentation = Object.fromEntries(entries);
  if (world === HvutAbilityWorld.PERSISTENT) {
    presentation["Better MagNet"] = presentation["Better Immobilize"];
    delete presentation["Better Immobilize"];
  }
  return presentation;
}

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
      const outcome = createHvutAbilityCatalog({
        world,
        presentationCatalog: presentationFor(world),
      });

      expect(outcome.kind).toBe("accepted");
      expect(Object.keys(outcome.catalog)).toHaveLength(75);
      expect(outcome.catalog["2H Parry"]).toMatchObject({
        unlock: [50, 200],
        point: [2, 3],
      });
      expect(outcome.catalog["2H Parry"].unlock).not.toBe(
        HvutAbilityRequirementCatalog["2H Parry"].unlock
      );
    }
  );

  it("keeps the world-owned control-spell name without forking progression", () => {
    const isekai = createHvutAbilityCatalog({
      world: HvutAbilityWorld.ISEKAI,
      presentationCatalog: presentationFor(HvutAbilityWorld.ISEKAI),
    });
    const persistent = createHvutAbilityCatalog({
      world: HvutAbilityWorld.PERSISTENT,
      presentationCatalog: presentationFor(HvutAbilityWorld.PERSISTENT),
    });

    expect(isekai.catalog["Better Immobilize"].point).toEqual([1, 2, 3, 4, 5]);
    expect(isekai.catalog["Better MagNet"]).toBeUndefined();
    expect(persistent.catalog["Better MagNet"].point).toEqual([1, 2, 3, 4, 5]);
    expect(persistent.catalog["Better Immobilize"]).toBeUndefined();
  });

  it("rejects partial or mixed-world catalogs instead of rendering some skills", () => {
    const partial = presentationFor(HvutAbilityWorld.PERSISTENT);
    delete partial["2H Parry"];
    partial["Better Immobilize"] = { category: "wrong world" };

    expect(
      createHvutAbilityCatalog({
        world: HvutAbilityWorld.PERSISTENT,
        presentationCatalog: partial,
      })
    ).toMatchObject({
      kind: "rejected",
      reason: "abilityCatalogIdentityMismatch",
      missing: ["2H Parry"],
      unexpected: ["Better Immobilize"],
    });
  });
});
