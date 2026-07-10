import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvut = fs.readFileSync(path.join(root, "src/i18n/hv-utils.js"), "utf8");
const bridge = fs.readFileSync(path.join(root, "src/i18n/hvut-world-policy-bridge.js"), "utf8");
const main = fs.readFileSync(path.join(root, "src/main.js"), "utf8");
const violations = [];

for (const required of [
  "createHvutWorldPolicyBridge",
  "worldPolicy.world",
  "worldPolicy.hvut.namespace",
  "worldPolicy.features.randomEncounter",
  "createHvutWorldPolicyBridge(CURRENT_WORLD_POLICY)",
  'Object.defineProperty(window, "HVAA_hvutWorldPolicy"',
  "writable: false",
  "value: policy",
]) {
  if (!bridge.includes(required)) violations.push(`HVUT world bridge must contain ${required}`);
}

for (const required of [
  "var HVUT_WORLD_POLICY = window.HVAA_hvutWorldPolicy;",
  "throw new Error('[HVAA][HVUT] world policy bridge missing');",
  "var IS_ISEKAI = HVUT_WORLD_POLICY.world === 'isekai';",
  "var world = HVUT_WORLD_POLICY.world;",
  "serverName: HVUT_WORLD_POLICY.serverName,",
  "storageNamespace: HVUT_WORLD_POLICY.storageNamespace,",
  "return HVUT_WORLD_POLICY.storageNamespace;",
  "const HVUT_WORLD = create_hvut_world_identity({ seasonStage: 'serverSeason' });",
]) {
  if (!hvut.includes(required)) violations.push(`HVUT runtime must contain ${required}`);
}

if (/var IS_ISEKAI[^\n]*(?:location|pathname)/.test(hvut)) {
  violations.push("HVUT runtime must not classify World from raw location markers");
}
if (!main.includes('import "./i18n/hvut-world-policy-bridge.js"')) {
  violations.push("main must install the frozen HVUT world bridge");
}
if (main.indexOf("hvut-world-policy-bridge.js") > main.indexOf("hv-utils.js")) {
  violations.push("main must install the HVUT world bridge before the sloppy runtime");
}

if (violations.length) {
  console.error("[verify-hvut-world-identity-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-world-identity-boundary] OK - HVUT consumes one frozen ingress world policy"
);
