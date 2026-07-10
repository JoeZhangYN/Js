import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";

export function createHvutWorldPolicyBridge(worldPolicy) {
  return Object.freeze({
    world: worldPolicy.world,
    serverName: worldPolicy.world,
    storageNamespace: worldPolicy.hvut.namespace,
    randomEncounter: worldPolicy.features.randomEncounter,
    auditIdentity: worldPolicy.auditIdentity,
  });
}

const policy = createHvutWorldPolicyBridge(CURRENT_WORLD_POLICY);

Object.defineProperty(window, "HVAA_hvutWorldPolicy", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: policy,
});
