import { classifyIngress } from "./ingress-identity.js";
import { selectWorldPolicy } from "./world-policy.js";

export const CURRENT_INGRESS_IDENTITY = classifyIngress(window.location);
export const CURRENT_WORLD_POLICY = selectWorldPolicy(CURRENT_INGRESS_IDENTITY.world);
