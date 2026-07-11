import { CURRENT_INGRESS_IDENTITY, CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import { selectHvutRuntimeEntryPolicy } from "./hvut-runtime-entry-policy.js";
import { selectHvutWorldProfile } from "./hvut-world-profile.js";

export function createHvutRuntimePolicyBridge(
  worldPolicy,
  ingressIdentity = CURRENT_INGRESS_IDENTITY
) {
  const profile = selectHvutWorldProfile(worldPolicy.world);
  if (!profile) return null;
  return Object.freeze({
    entry: Object.freeze({ mode: selectHvutRuntimeEntryPolicy(ingressIdentity).mode }),
    authority: Object.freeze({
      serverName: worldPolicy.world,
      storageNamespace: worldPolicy.hvut.namespace,
      randomEncounter: worldPolicy.features.randomEncounter,
      auditIdentity: worldPolicy.auditIdentity,
    }),
    profile,
  });
}

const policy = createHvutRuntimePolicyBridge(CURRENT_WORLD_POLICY, CURRENT_INGRESS_IDENTITY);

Object.defineProperty(window, "HVAA_hvutRuntimePolicy", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: policy,
});
