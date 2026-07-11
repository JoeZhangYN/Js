import { GameWorld } from "../core/ingress-identity.js";

export const HvutRuntimeEntryMode = Object.freeze({
  ACTIVE: "active",
  EXCLUDED_ISEKAI_EQUIPMENT_DOCUMENT: "excludedIsekaiEquipmentDocument",
});

export function selectHvutRuntimeEntryPolicy(ingressIdentity) {
  const isIsekaiEquipmentDocument =
    ingressIdentity?.world === GameWorld.ISEKAI &&
    /^\/isekai\/equip(?:\/|$)/.test(String(ingressIdentity?.pathname || ""));

  return Object.freeze({
    mode: isIsekaiEquipmentDocument
      ? HvutRuntimeEntryMode.EXCLUDED_ISEKAI_EQUIPMENT_DOCUMENT
      : HvutRuntimeEntryMode.ACTIVE,
  });
}
