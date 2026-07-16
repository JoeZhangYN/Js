import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const violations = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function productionFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return productionFiles(absolute);
    if (!entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) return [];
    return [absolute];
  });
}

const ownerFile = "src/battle/battle-session.js";
const owner = read(ownerFile);
for (const required of [
  "runBattleSessionAutomation",
  "BattleSessionEvent",
  "START_OR_RESUME",
  "READ_CONTEXT",
  "MARK_TERMINAL",
  "BattleSessionCheckpointSlice.BATTLE_SESSION",
  "recordBattleSessionFailure",
  "BATTLE_SESSION_FAILURE_KEY",
]) {
  const aggregate = [
    owner,
    read("src/battle/battle-session-store.js"),
    read("src/battle/battle-session-lifecycle.js"),
    read("src/battle/battle-session-failure.js"),
  ].join("\n");
  if (!aggregate.includes(required))
    violations.push(`${ownerFile} capability must own ${required}`);
}

if (
  /BATTLE_ROUND_FAILURE_KEY|battleRoundFailure/.test(
    owner +
      read("src/battle/battle-session-failure.js") +
      read("src/core/diagnostic-evidence-keys.js")
  )
) {
  violations.push("battle session failure code identity must not regress to battleRoundFailure");
}

if (fs.existsSync(path.join(root, "src/battle/battle-round.js"))) {
  violations.push("src/battle/battle-round.js retired GM round-state owner must stay deleted");
}

const legacyOwner = read("src/battle/battle-session-legacy-storage.js");
for (const key of ["roundType", "roundNow", "roundAll"]) {
  if (!legacyOwner.includes(`"${key}"`)) {
    violations.push(`battle-session-legacy-storage.js must delete legacy ${key}`);
  }
}
if (/\b(?:getValue|setValue)\(/.test(legacyOwner)) {
  violations.push("legacy battle round storage may be deleted but never read or migrated");
}

for (const file of productionFiles(src)) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  if (/runBattleRoundAutomation|BattleRoundEvent|STORAGE_KEYS\.ROUND_(?:TYPE|NOW|ALL)/.test(text)) {
    violations.push(`${relative} must not restore retired battle-round persistence`);
  }
  if (
    relative !== "src/battle/battle-session-legacy-storage.js" &&
    /\b(?:getValue|setValue|delValue)\(\s*["']round(?:Type|Now|All)["']/.test(text)
  ) {
    violations.push(`${relative} must not read or write legacy battle round keys`);
  }
}

const lifecycle = read("src/battle/battle-session-lifecycle.js");
for (const required of [
  "isBattleInitialization(initializingText)",
  "classifyBattleRoundType(initializingText)",
  "BattleSessionPhase.ACTIVE",
  '"terminalSession"',
]) {
  if (!lifecycle.includes(required))
    violations.push(`battle session lifecycle must own ${required}`);
}

const tests = [
  read("src/battle/battle-session.test.js"),
  read("src/pages/encounter-session-lifecycle.test.js"),
].join("\n");
for (const required of [
  "replace a retired arena identity",
  "resumes only the active session checkpoint",
  "neither initialization evidence nor a checkpoint exists",
  "records progress and terminal identity",
  "exposes active zero count, and settles once",
]) {
  if (!tests.includes(required)) violations.push(`battle session tests must cover ${required}`);
}

if (violations.length) {
  console.error("[verify-battle-round-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log("[verify-battle-round-boundary] OK — battle session identity is checkpoint-owned");
