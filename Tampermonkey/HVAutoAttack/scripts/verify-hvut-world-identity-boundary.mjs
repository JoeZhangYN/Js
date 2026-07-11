import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvut = fs.readFileSync(path.join(root, "src/i18n/hv-utils.js"), "utf8");
const bridge = fs.readFileSync(path.join(root, "src/i18n/hvut-runtime-policy-bridge.js"), "utf8");
const profile = fs.readFileSync(path.join(root, "src/i18n/hvut-world-profile.js"), "utf8");
const profileTest = fs.readFileSync(path.join(root, "src/i18n/hvut-world-profile.test.js"), "utf8");
const main = fs.readFileSync(path.join(root, "src/main.js"), "utf8");
const violations = [];

for (const required of [
  "createHvutRuntimePolicyBridge",
  "worldPolicy.world",
  "worldPolicy.hvut.namespace",
  "worldPolicy.features.randomEncounter",
  "selectHvutWorldProfile(worldPolicy.world)",
  "entry: Object.freeze(",
  "authority: Object.freeze(",
  "profile,",
  "selectHvutRuntimeEntryPolicy(ingressIdentity).mode",
  "createHvutRuntimePolicyBridge(CURRENT_WORLD_POLICY, CURRENT_INGRESS_IDENTITY)",
  'Object.defineProperty(window, "HVAA_hvutRuntimePolicy"',
  "writable: false",
  "value: policy",
]) {
  if (!bridge.includes(required)) violations.push(`HVUT world bridge must contain ${required}`);
}

for (const required of [
  "var HVUT_RUNTIME_POLICY = window.HVAA_hvutRuntimePolicy;",
  "throw new Error('[HVAA][HVUT] runtime policy bridge missing');",
  "var HVUT_ENTRY_MODE = HVUT_RUNTIME_POLICY.entry.mode;",
  "var world = HVUT_RUNTIME_POLICY.profile.identity;",
  "serverName: HVUT_RUNTIME_POLICY.authority.serverName,",
  "storageNamespace: HVUT_RUNTIME_POLICY.authority.storageNamespace,",
  "return HVUT_RUNTIME_POLICY.authority.storageNamespace;",
  "var preferred = HVUT_RUNTIME_POLICY.profile.feedbackCopy;",
  "hvPageType: HVUT_RUNTIME_POLICY.profile.encounterPageType",
  "catalog: HVUT_RUNTIME_POLICY.profile.priceCatalog",
  "profile: HVUT_RUNTIME_POLICY.profile.top",
  "materialCountByQuality: HVUT_RUNTIME_POLICY.profile.armory.materialCountByQuality",
  "const HVUT_WORLD = create_hvut_world_identity({ seasonStage: 'serverSeason' });",
]) {
  if (!hvut.includes(required)) violations.push(`HVUT runtime must contain ${required}`);
}

for (const required of [
  "export function selectHvutWorldProfile(world)",
  "encounterPageType",
  "priceCatalog: Object.freeze(",
  "top: Object.freeze(",
  "materialCountByQuality: Object.freeze(",
]) {
  if (!profile.includes(required)) violations.push(`HVUT world profile must contain ${required}`);
}
for (const required of [
  "binds authority-only variation without changing shared business calls",
  "rejects an unknown world instead of falling back to another authority",
]) {
  if (!profileTest.includes(required))
    violations.push(`HVUT world profile tests must cover ${required}`);
}

if (/\bIS_ISEKAI\b/.test(hvut)) {
  violations.push("HVUT runtime must not expose a world boolean to business code");
}
const approvedPolicyReads = [
  "var HVUT_RUNTIME_POLICY =",
  "if (!HVUT_RUNTIME_POLICY ||",
  "var HVUT_ENTRY_MODE =",
  "var world = HVUT_RUNTIME_POLICY.profile.identity;",
  "HVUT_RUNTIME_POLICY.authority.serverName",
  "HVUT_RUNTIME_POLICY.authority.storageNamespace",
  "HVUT_RUNTIME_POLICY.profile.feedbackCopy",
  "if (HVUT_RUNTIME_POLICY.profile.identity === 'isekai')",
  "bindRe($re, { config: $config, hvPageType: HVUT_RUNTIME_POLICY.profile.encounterPageType",
  "bindPrice($price, { config: $config, catalog: HVUT_RUNTIME_POLICY.profile.priceCatalog",
  "bindTop(_top, { config: $config, player: () => _player, re: () => $re, profile: HVUT_RUNTIME_POLICY.profile.top",
  "bindArmory($armory, { config: $config, equip: $equip, price: $price, materialCountByQuality: HVUT_RUNTIME_POLICY.profile.armory.materialCountByQuality",
];
for (const line of hvut.split(/\r?\n/).filter((entry) => entry.includes("HVUT_RUNTIME_POLICY"))) {
  if (!approvedPolicyReads.some((approved) => line.includes(approved))) {
    violations.push(
      `HVUT runtime policy read escaped composition/adapter boundary: ${line.trim()}`
    );
  }
}
if (!main.includes('import "./i18n/hvut-runtime-policy-bridge.js"')) {
  violations.push("main must install the frozen HVUT world bridge");
}
if (main.indexOf("hvut-runtime-policy-bridge.js") > main.indexOf("hv-utils.js")) {
  violations.push("main must install the HVUT world bridge before the sloppy runtime");
}

if (violations.length) {
  console.error("[verify-hvut-world-identity-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-world-identity-boundary] OK - HVUT binds one frozen world profile without business identity reads"
);
