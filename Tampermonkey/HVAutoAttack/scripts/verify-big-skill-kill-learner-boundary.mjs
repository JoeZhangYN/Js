import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/big-skill-kill-learner.js");
const failureOwner = path.normalize("src/state/big-skill-kill-learner-failure.js");
const learnedMapOwner = path.normalize("src/state/big-skill-kill-learned-map.js");
const ownerTest = path.normalize("src/state/big-skill-kill-learner.test.js");
const diagnosticTest = path.normalize("src/state/big-skill-kill-learner-diagnostic.test.js");
const failureTest = path.normalize("src/state/big-skill-kill-learner-failure.test.js");
const ownerNormalizationTest = path.normalize(
  "src/state/big-skill-kill-learner-normalization.test.js"
);
const snapshot = path.normalize("src/battle/snapshot.js");
const observationLearning = path.normalize("src/battle/battle-observation-learning.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const maintenanceOwner = path.normalize("src/state/storage-maintenance-record-sources.js");
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
  const source = fs.readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== learnedMapOwner &&
      relative !== ownerTest &&
      relative !== diagnosticTest &&
      relative !== failureTest &&
      /from\s+["'](?:\.\/|\.\.\/\.\.\/state\/|\.\.\/state\/)big-skill-kill-learner\.js["']/.test(
        line
      ) &&
      /\b(?:recordBigSkillCast|finalizeBigSkillPending|ofcWillKillBoss)\b/.test(line)
    ) {
      violations.push(`${where} legacy big skill kill learner imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== learnedMapOwner &&
      relative !== ownerTest &&
      relative !== diagnosticTest &&
      relative !== failureTest &&
      relative !== ownerNormalizationTest &&
      relative !== maintenanceOwner &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.LEARNED_BIG_KILL\b/.test(line)
    ) {
      violations.push(`${where} learned big-kill storage belongs in big skill kill learner`);
    }
  });
  for (const call of source.matchAll(/runBigSkillKillLearningAutomation\(\s*\{[\s\S]*?\}\s*\)/g)) {
    if (
      relative !== owner &&
      call[0].includes("BigSkillKillLearningEvent.RECORD_CAST") &&
      /\bsnap\s*:/.test(call[0])
    ) {
      violations.push(`${rel(file)} must pass observedBosses, not snap, to big-skill record cast`);
    }
    if (
      relative !== owner &&
      call[0].includes("BigSkillKillLearningEvent.WILL_KILL_BOSS") &&
      /\bsnap\s*:/.test(call[0])
    ) {
      violations.push(
        `${rel(file)} must pass ofcCooldown/overcharge/bossHpMax, not snap, to big-skill kill query`
      );
    }
    if (
      relative !== owner &&
      call[0].includes("BigSkillKillLearningEvent.FINALIZE_PENDING") &&
      /\bsnap\s*:/.test(call[0])
    ) {
      violations.push(
        `${rel(file)} must pass globalTurn/liveMonsterIds, not snap, to big-skill kill finalize`
      );
    }
  }
  if (
    relative !== owner &&
    /BigSkillKillLearningEvent\.FINALIZE_PENDING[\s\S]{0,220}\bsnap:\s*\{[\s\S]{0,120}\bview\s*:/.test(
      source
    )
  ) {
    violations.push(
      `${rel(file)} must pass liveMonsterIds, not full view, to big-skill kill finalize`
    );
  }
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runBigSkillKillLearningAutomation",
  "BigSkillKillLearningEvent",
  "OptionEvent.READ_FIELD",
  "normalizeTurn",
  "normalizePending",
  "normalizeLiveMonsterIds",
  "normalizeBossHpMax",
  "hydrateLearnedBigKill",
  "readLearnedBigKillMap",
  "persistLearnedBigKill",
  "recordBigSkillKillLearningDiagnostic",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if ((ownerText.match(/normalizePending\(/g) || []).length < 2) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize pending big-kill state`);
}
if ((ownerText.match(/readLearnedBigKillMap\(/g) || []).length < 2) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize learned big-kill storage reads`);
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read option fields directly`);
}
const finalizeBody = ownerText.match(
  /function finalizeBigSkillPending\(event\) \{[\s\S]*?\n\}/
)?.[0];
if (
  !finalizeBody?.includes("event?.liveMonsterIds") ||
  !finalizeBody?.includes("event?.globalTurn")
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} finalize must consume narrow globalTurn/liveMonsterIds facts`
  );
}
if (
  /\bsnap\?\.globalTurn\b|\bsnap\.globalTurn\b|\bsnap\?\.liveMonsterIds\b|\bsnap\.liveMonsterIds\b|\bsnap\?\.view\b|\bsnap\.view\b/.test(
    finalizeBody || ""
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} finalize must not consume snap-shaped input or full monster view rows`
  );
}
const recordBody = ownerText.match(
  /function recordBigSkillCast\(code, event\) \{[\s\S]*?\n\}/
)?.[0];
if (!recordBody?.includes("event?.observedBosses") || !recordBody?.includes("event?.globalTurn")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} record cast must consume observedBosses and globalTurn`
  );
}
if (
  /\bsnap\?\.view\b|\bsnap\.view\b|\bsnap\?\.globalTurn\b|\bsnap\.globalTurn\b/.test(
    recordBody || ""
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} record cast must not consume full snap`);
}
const willKillBody = ownerText.match(/function ofcWillKillBoss\(event\) \{[\s\S]*?\n\}/)?.[0];
if (
  !willKillBody?.includes("event?.ofcCooldown") ||
  !willKillBody?.includes("event?.overcharge") ||
  !willKillBody?.includes("event?.bossHpMax")
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} kill query must consume narrow ofcCooldown/overcharge/bossHpMax facts`
  );
}
if (
  /\bsnap\?\.cdMap\b|\bsnap\.cdMap\b|\bsnap\?\.oc\b|\bsnap\.oc\b|\bsnap\?\.view\b|\bsnap\.view\b/.test(
    willKillBody || ""
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} kill query must not consume full snap`);
}

const snapshotText = fs.readFileSync(path.join(root, snapshot), "utf8");
const observationLearningText = fs.readFileSync(path.join(root, observationLearning), "utf8");
if (!observationLearningText.includes("liveMonsterIds(event.view)")) {
  violations.push(
    `${observationLearning.replaceAll("\\", "/")} must derive narrow liveMonsterIds for finalize`
  );
}
if (/FINALIZE_PENDING[\s\S]{0,180}\bsnap\s*:/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must not pass snap-shaped input to big-skill kill finalize`
  );
}

for (const legacy of ["recordBigSkillCast", "finalizeBigSkillPending", "ofcWillKillBoss"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runBigSkillKillLearningAutomation(event)`
    );
  }
}

if (!ownerText.includes("const bigSkillKillLearningEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route big-skill kill learning events through a handler table`
  );
}
const ownerEntry =
  ownerText.match(/export function runBigSkillKillLearningAutomation[\s\S]*?\n}/)?.[0] || "";
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
  );
}
if (/\bevent\.type\b/.test(ownerEntry) || !/\bevent\?\.type\b/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for null big-skill kill events`
  );
}
for (const internal of ["recordBigSkillCast(", "finalizeBigSkillPending(", "ofcWillKillBoss("]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through bigSkillKillLearningEventHandlers`
    );
  }
}
if (!/runBigSkillKillLearningAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null big-skill kill events`);
}
for (const required of [
  "routes dynamic settle diagnostics through the typed console entry",
  "dynamicBigKillLog",
  "runDiagnosticConsoleAutomation",
  "big-skill kill learning diagnostic",
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if ((ownerText.match(/\bsetValue\(/g) || []).length !== 0) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not write learned big-kill storage directly`
  );
}
if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} big-skill kill learning diagnostics must use the typed diagnostic console entry`
  );
}
if (
  !failureOwnerText.includes("LearnedMonsterStoreEvent.UPSERT_MANY") ||
  !failureOwnerText.includes("LearnedMonsterFamily.BIG_KILL") ||
  !failureOwnerText.includes("StorageWriteOutcome.FAILED")
) {
  violations.push(
    `${failureOwner.replaceAll("\\", "/")} must classify learned big-kill storage write failures`
  );
}
for (const required of [
  "BIG_SKILL_KILL_LEARNING_FAILURE_KEY",
  "HVAA:lastBigSkillKillLearningFailure",
  "recordBigSkillKillLearningFailure",
  "bigSkillKillLearning",
  "persistLearnedBigKill",
  "recordBigSkillKillLearningDiagnostic",
  "DiagnosticConsoleEvent.INFO",
  "DiagnosticConsoleEvent.WARN",
  "runDiagnosticConsoleAutomation",
  "LearnedMonsterFamily.BIG_KILL",
  "LearnedMonsterStoreEvent.UPSERT_MANY",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(failureOwnerText)) {
  violations.push(
    `${failureOwner.replaceAll("\\", "/")} big-skill kill learning diagnostics must use the typed diagnostic console entry`
  );
}
for (const required of [
  "BIG_SKILL_KILL_LEARNING_FAILURE_KEY",
  "update-learned",
  "storageWrite",
  "big-kill learning write blocked",
  "runDiagnosticConsoleAutomation",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
if (
  !ownerText.includes("const completion = persistLearnedBigKill(") ||
  !ownerText.includes("if (!persisted) return false")
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must keep pending when learned big-kill persistence fails`
  );
}

if (violations.length) {
  console.error("[verify-big-skill-kill-learner-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-big-skill-kill-learner-boundary] OK — big-skill kill learning is behind one entry"
);
