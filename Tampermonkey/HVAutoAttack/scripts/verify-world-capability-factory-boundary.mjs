import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function requireText(relative, needles) {
  const text = read(relative);
  for (const needle of needles) {
    if (!text.includes(needle)) violations.push(`${relative} must contain ${needle}`);
  }
  return text;
}

if (fs.existsSync(path.join(src, "env.js"))) {
  violations.push("src/env.js is a retired scattered world-authority path");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "i18n") walk(full);
      continue;
    }
    if (!entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) continue;
    const relative = path.relative(root, full).replaceAll("\\", "/");
    const text = fs.readFileSync(full, "utf8");
    for (const marker of ["isIsekai", "PageWorld", "ISEKAI_PAGE_READY", "../env.js"]) {
      if (text.includes(marker)) {
        violations.push(`${relative} must not rediscover or propagate world marker ${marker}`);
      }
    }
  }
}

walk(src);

requireText("src/core/ingress-identity.js", [
  "export const SiteIdentity",
  "export const GameWorld",
  "export function classifyIngress",
  "Object.freeze",
]);
requireText("src/core/current-runtime.js", [
  "CURRENT_INGRESS_IDENTITY = classifyIngress(window.location)",
  "CURRENT_WORLD_POLICY = selectWorldPolicy(CURRENT_INGRESS_IDENTITY.world)",
]);
requireText("src/core/world-policy.js", [
  "[GameWorld.PERSISTENT]",
  "[GameWorld.ISEKAI]",
  "storage:",
  "battleApi:",
  "monsterKnowledge:",
  "features:",
  "forgeCost:",
]);

for (const [relative, required] of [
  ["src/state/storage.js", "createStorageCapability"],
  ["src/pages/lobby-automation.js", "createLobbyAutomationCapability"],
  ["src/pages/showequip-forge-cost.js", "createForgeCostCapability"],
  ["src/battle/battle-api-world-context.js", "createBattleApiWorldContextCapability"],
  ["src/state/monster-db-store.js", "createMonsterDbStoreCapability"],
  ["src/battle/monster-db-sync.js", "createMonsterDbSyncCapability"],
]) {
  const text = requireText(relative, [required, "CURRENT_WORLD_POLICY"]);
  if (/window\.location|location\.pathname|location\.href/.test(text)) {
    violations.push(`${relative} must consume bound policy rather than read route identity`);
  }
}
requireText("src/state/store.js", ["createRuntimeStoreCapability"]);

const pageText = read("src/pages/page-automation.js");
if (!pageText.includes("[PageKind.ISEKAI_LOBBY]: runLobbyPageAutomation")) {
  violations.push("page automation must route both lobby identities through one business call");
}
if (/\bpage\s*:|\bworld\s*:|isIsekai/.test(pageText)) {
  violations.push("page automation must not propagate ingress identity into business events");
}

if (violations.length) {
  console.error("[verify-world-capability-factory-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-world-capability-factory-boundary] OK — world authorities are factory-bound behind context-free calls"
);
