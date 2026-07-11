import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvut = fs.readFileSync(path.join(root, "src/i18n/hv-utils.js"), "utf8");
const policy = fs.readFileSync(path.join(root, "src/i18n/hvut-runtime-entry-policy.js"), "utf8");
const bridge = fs.readFileSync(path.join(root, "src/i18n/hvut-runtime-policy-bridge.js"), "utf8");
const violations = [];

for (const required of [
  "HvutRuntimeEntryMode",
  'EXCLUDED_ISEKAI_EQUIPMENT_DOCUMENT: "excludedIsekaiEquipmentDocument"',
  "export function selectHvutRuntimeEntryPolicy(ingressIdentity)",
  "ingressIdentity?.world === GameWorld.ISEKAI",
  "/^\\/isekai\\/equip(?:\\/|$)/",
]) {
  if (!policy.includes(required)) violations.push(`HVUT entry policy must contain ${required}`);
}

for (const required of ["selectHvutRuntimeEntryPolicy(ingressIdentity).mode", "entry: Object.freeze("]) {
  if (!bridge.includes(required)) violations.push(`HVUT bridge must carry ${required}`);
}

const sharedRequest = hvut.indexOf("const $ajax = {");
const runtimeGate = hvut.indexOf("if (HVUT_ENTRY_MODE === 'active') {");
const worldBranch = hvut.indexOf("if (HVUT_RUNTIME_POLICY.profile.identity === 'isekai') {", runtimeGate);
if (sharedRequest < 0 || runtimeGate < 0 || worldBranch < 0) {
  violations.push("HVUT runtime must expose shared composition, entry gate and world branch");
} else if (!(sharedRequest < runtimeGate && runtimeGate < worldBranch)) {
  violations.push("HVUT shared composition must precede entry policy and world runtime startup");
}
if (/is_hvut_isekai_equip_page|window\.location\.pathname/.test(hvut)) {
  violations.push("HVUT runtime must not rediscover equipment-document entry identity");
}

if (violations.length) {
  console.error("[verify-hvut-equip-page-gate-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-equip-page-gate-boundary] OK - typed entry policy gates composed HVUT runtime"
);
