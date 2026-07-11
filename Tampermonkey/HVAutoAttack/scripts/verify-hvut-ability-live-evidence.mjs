import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { HvutAbilityAuthenticatedDomEvidence as domEvidence } from "../src/data/hvut-ability-authenticated-dom-evidence.js";
import { HvutAbilityLiveEvidence as evidence } from "../src/data/hvut-ability-live-evidence.js";
import { decideHvutAbilityPointContrast } from "../src/i18n/hvut-ability-background-contrast.js";

const failures = [];
const fail = (message) => failures.push(message);
const expectedCenterRgb = Object.freeze({
  "5bf.png": [28, 36, 142],
  "7gf.png": [87, 153, 22],
  "2rf.png": [161, 0, 0],
  "1pf.png": [174, 1, 160],
  "2ru.png": [191, 0, 0],
  "2x.png": [0, 0, 0],
});

if (evidence.schemaVersion !== 1) fail("schemaVersion must be 1");
if (evidence.evidenceIdentity !== "hvutAbilityLiveSurfaceObservation")
  fail("wrong evidence identity");
if (evidence.claimScope !== "publicAssetsAndUnauthenticatedPageReachability") {
  fail("claim scope must not overstate authenticated DOM reachability");
}
if (evidence.authenticatedDomStatus !== "unknownAuthenticationRequired") {
  fail("authenticated DOM must remain Unknown until an authenticated capture succeeds");
}

const expectedAssets = new Set(["5bf.png", "7gf.png", "2rf.png", "1pf.png", "2ru.png", "2x.png"]);
for (const asset of expectedAssets) {
  const pair = evidence.assets.filter((entry) => entry.asset === asset);
  if (
    pair.length !== 2 ||
    !pair.some((entry) => entry.world === "main") ||
    !pair.some((entry) => entry.world === "isekai")
  ) {
    fail(`${asset}: main/isekai evidence pair missing`);
    continue;
  }
  if (pair.some((entry) => entry.status !== 200 || entry.reachability !== "successful")) {
    fail(`${asset}: public resource was not reachable`);
  }
  if (pair[0].sha256 !== pair[1].sha256) fail(`${asset}: world asset bytes drifted`);
  if (
    pair.some((entry) => entry.width <= 0 || entry.height !== 32 || entry.centerRgba.length !== 4)
  ) {
    fail(`${asset}: invalid decoded PNG evidence`);
  }
  if (
    pair.some((entry) => entry.centerRgba.slice(0, 3).join() !== expectedCenterRgb[asset].join())
  ) {
    fail(`${asset}: center pixel drifted from captured palette`);
  }
}

for (const page of evidence.pages) {
  if (
    page.reachability !== "authenticationRequired" ||
    !page.hasLoginForm ||
    page.hasAbilitySurface
  ) {
    fail(`${page.world}: unauthenticated page observation was overstated`);
  }
}

for (const entry of evidence.assets.filter((asset) => asset.state === "learned")) {
  const decision = decideHvutAbilityPointContrast({
    backgroundImage: `url(${new URL(entry.url).pathname})`,
  });
  if (decision.backgroundFamily !== entry.family || decision.source !== "abilityAssetOpaque") {
    fail(`${entry.world}:${entry.asset}: contrast policy disagrees with live asset identity`);
  }
  if (decision.effectiveBackground !== `rgb(${expectedCenterRgb[entry.asset].join(", ")})`) {
    fail(`${entry.world}:${entry.asset}: policy color is not derived from captured center pixel`);
  }
}

if (domEvidence.currentReachability !== "historicalUserReportNotCurrentProbe") {
  fail("user-reported authenticated DOM must not be presented as a current probe");
}
for (const sample of domEvidence.samples) {
  const decision = decideHvutAbilityPointContrast(sample);
  if (decision.textColor !== sample.expectedTextColor)
    fail(`${sample.name}: reported DOM contrast regressed`);
  if (sample.classTokens.some((token) => token.includes(".")))
    fail(`${sample.name}: class token contains a dot`);
}

const harness = readFileSync(
  fileURLToPath(new URL("../browser-smoke/hvut-ability.html", import.meta.url)),
  "utf8"
);
if (!harness.includes("/src/i18n/hvut-ability-background-contrast.js")) {
  fail("browser smoke must consume the production contrast entry");
}
if (!harness.includes("/src/data/hvut-ability-authenticated-dom-evidence.js")) {
  fail("browser smoke must consume the reported authenticated DOM evidence");
}

if (failures.length) {
  console.error("[verify-hvut-ability-live-evidence] failures:");
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}
console.log(
  `[verify-hvut-ability-live-evidence] OK - ${evidence.assets.length} resource observations; authenticated DOM=${evidence.authenticatedDomStatus}`
);
