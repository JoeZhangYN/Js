import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/incoming-burst-learner.js");
const failureOwner = path.normalize("src/state/incoming-burst-learner-failure.js");
const ownerTest = path.normalize("src/state/incoming-burst-learner.test.js");
const failureTest = path.normalize("src/state/incoming-burst-learner-failure.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const monsterIdentity = path.normalize("src/monster/monster-identity.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      /from\s+["'](?:\.\/|\.\.\/\.\.\/state\/|\.\.\/state\/)incoming-burst-learner\.js["']/.test(
        line
      ) &&
      /\b(?:updateBurstFromEvents|getLearnedBurstMap)\b/.test(line)
    ) {
      violations.push(`${where} legacy incoming burst learner imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      relative !== monsterIdentity &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.LEARNED_INCOMING_BURST\b/.test(line)
    ) {
      violations.push(`${where} learned incoming-burst storage belongs in incoming burst learner`);
    }
    if (relative === owner && /from\s+["']\.\.\/battle\/log-parser\.js["']/.test(line)) {
      violations.push(
        `${where} incoming burst learning must use monster identity matching, not battle log-parser internals`
      );
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runIncomingBurstLearningAutomation",
  "IncomingBurstLearningEvent",
  "STORAGE_KEYS.LEARNED_INCOMING_BURST",
  "monsterIdentities",
  "normalizeMonsterId",
  "../monster/monster-identity.js",
  "normalizeLearnedBurstRecord",
  "readLearnedBurstMap",
  "persistLearnedIncomingBurst",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if ((ownerText.match(/readLearnedBurstMap\(/g) || []).length < 3) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must normalize learned incoming-burst storage reads`
  );
}
if (/\bmonsterStatus\b/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must learn from narrow monsterIdentities, not full monsterStatus`
  );
}

for (const legacy of ["updateBurstFromEvents", "getLearnedBurstMap"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runIncomingBurstLearningAutomation(event)`
    );
  }
}

if (!ownerText.includes("const incomingBurstLearningEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route incoming burst learning events through a handler table`
  );
}
const ownerEntry =
  ownerText.match(/export function runIncomingBurstLearningAutomation[\s\S]*?\n}/)?.[0] || "";
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
  );
}
if (/\bevent\.type\b/.test(ownerEntry) || !/\bevent\?\.type\b/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for null incoming burst events`
  );
}
for (const internal of ["updateBurstFromEvents(", "getLearnedBurstMap("]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through incomingBurstLearningEventHandlers`
    );
  }
}
if (!/runIncomingBurstLearningAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null incoming burst events`);
}

if ((ownerText.match(/\bsetValue\(/g) || []).length !== 0) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not write learned incoming-burst storage directly`
  );
}
if (
  !failureOwnerText.includes("LearnedMonsterStoreEvent.UPSERT_MANY") ||
  !failureOwnerText.includes("LearnedMonsterFamily.INCOMING_BURST") ||
  !failureOwnerText.includes("StorageWriteOutcome.FAILED")
) {
  violations.push(
    `${failureOwner.replaceAll("\\", "/")} must classify learned incoming-burst storage write failures`
  );
}
for (const required of [
  "INCOMING_BURST_LEARNING_FAILURE_KEY",
  "HVAA:lastIncomingBurstLearningFailure",
  "recordIncomingBurstLearningFailure",
  "incomingBurstLearning",
  "persistLearnedIncomingBurst",
  "DiagnosticConsoleEvent.WARN",
  "runDiagnosticConsoleAutomation",
  "LearnedMonsterFamily.INCOMING_BURST",
  "LearnedMonsterStoreEvent.UPSERT_MANY",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(failureOwnerText)) {
  violations.push(
    `${failureOwner.replaceAll("\\", "/")} incoming-burst learning diagnostics must use the typed diagnostic console entry`
  );
}
for (const required of [
  "INCOMING_BURST_LEARNING_FAILURE_KEY",
  "update-learned",
  "storageWrite",
  "incoming burst learning write blocked",
  "runDiagnosticConsoleAutomation",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-incoming-burst-learner-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-incoming-burst-learner-boundary] OK — incoming burst learning is behind one entry"
);
