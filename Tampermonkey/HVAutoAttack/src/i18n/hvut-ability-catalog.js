import { HvutAbilityRequirementCatalog } from "../data/hvut-ability-requirements.js";

export const HvutAbilityWorld = Object.freeze({
  ISEKAI: "isekai",
  PERSISTENT: "persistent",
});

export const HvutAbilityCatalogEvidence = Object.freeze({
  revision: "2026-07-11-current-progression",
  observedAt: "2026-07-11T11:07:29Z",
  sourceIdentity: "user-reported-live-hentaiverse-ability-dom",
  reachability: "successful",
  page: "https://hentaiverse.org/?s=Character&ss=ab&tree=twohanded",
  observedFact: Object.freeze({
    name: "2H Parry",
    rankCount: 2,
  }),
});

const WORLD_NAME_POLICY = Object.freeze({
  [HvutAbilityWorld.ISEKAI]: Object.freeze({
    required: "Better Immobilize",
    excluded: "Better MagNet",
  }),
  [HvutAbilityWorld.PERSISTENT]: Object.freeze({
    required: "Better MagNet",
    excluded: "Better Immobilize",
  }),
});

function requirementForName(name) {
  return name === "Better MagNet"
    ? HvutAbilityRequirementCatalog["Better Immobilize"]
    : HvutAbilityRequirementCatalog[name];
}

function expectedNamesForWorld(world) {
  const names = Object.keys(HvutAbilityRequirementCatalog);
  if (world === HvutAbilityWorld.PERSISTENT) {
    return names.map((name) =>
      name === "Better Immobilize" ? "Better MagNet" : name
    );
  }
  return names;
}

export function createHvutAbilityCatalog({ world, presentationCatalog }) {
  const policy = WORLD_NAME_POLICY[world];
  if (!policy) {
    return Object.freeze({
      kind: "rejected",
      reason: "unknownAbilityWorld",
      world,
    });
  }
  if (!presentationCatalog || typeof presentationCatalog !== "object") {
    return Object.freeze({
      kind: "rejected",
      reason: "presentationCatalogMissing",
      world,
    });
  }

  const expectedNames = expectedNamesForWorld(world);
  const expected = new Set(expectedNames);
  const actualNames = Object.keys(presentationCatalog);
  const missing = expectedNames.filter((name) => !(name in presentationCatalog));
  const unexpected = actualNames.filter((name) => !expected.has(name));
  if (
    missing.length ||
    unexpected.length ||
    !(policy.required in presentationCatalog) ||
    policy.excluded in presentationCatalog
  ) {
    return Object.freeze({
      kind: "rejected",
      reason: "abilityCatalogIdentityMismatch",
      world,
      missing: Object.freeze(missing),
      unexpected: Object.freeze(unexpected),
    });
  }

  const catalog = {};
  for (const name of expectedNames) {
    const requirement = requirementForName(name);
    catalog[name] = {
      ...presentationCatalog[name],
      unlock: [...requirement.unlock],
      point: [...requirement.point],
    };
  }
  return Object.freeze({
    kind: "accepted",
    world,
    evidence: HvutAbilityCatalogEvidence,
    catalog,
  });
}
