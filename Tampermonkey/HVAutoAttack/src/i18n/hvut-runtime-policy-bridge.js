import { CURRENT_INGRESS_IDENTITY, CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import { selectHvutRuntimeEntryPolicy } from "./hvut-runtime-entry-policy.js";

export function createHvutRuntimePolicyBridge(
  worldPolicy,
  ingressIdentity = CURRENT_INGRESS_IDENTITY
) {
  return Object.freeze({
    world: worldPolicy.world,
    serverName: worldPolicy.world,
    storageNamespace: worldPolicy.hvut.namespace,
    randomEncounter: worldPolicy.features.randomEncounter,
    auditIdentity: worldPolicy.auditIdentity,
    entryMode: selectHvutRuntimeEntryPolicy(ingressIdentity).mode,
  });
}

const policy = createHvutRuntimePolicyBridge(CURRENT_WORLD_POLICY, CURRENT_INGRESS_IDENTITY);

Object.defineProperty(window, "HVAA_hvutRuntimePolicy", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: policy,
});
