import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/cd-learner.js");
const failureOwner = path.normalize("src/state/cd-learner-failure.js");
const ownerTest = path.normalize("src/state/cd-learner.test.js");
const failureTest = path.normalize("src/state/cd-learner-failure.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
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
      relative !== ownerTest &&
      relative !== failureTest &&
      /from\s+["'](?:\.\/|\.\.\/\.\.\/state\/|\.\.\/state\/)cd-learner\.js["']/.test(line) &&
      /\b(?:recordCdFire|finalizeCdPending|getLearnedCd)\b/.test(line)
    ) {
      violations.push(`${where} legacy CD learner imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.LEARNED_CD\b/.test(line)
    ) {
      violations.push(`${where} learned CD storage belongs in cd learner`);
    }
  });
  for (const call of source.matchAll(/runCdLearningAutomation\(\s*\{[\s\S]*?\}\s*\)/g)) {
    if (
      relative !== owner &&
      call[0].includes("CdLearningEvent.RECORD_FIRE") &&
      /\bsnap\s*:/.test(call[0])
    ) {
      violations.push(`${rel(file)} must pass globalTurn, not snap, to CD fire learning`);
    }
    if (
      relative !== owner &&
      call[0].includes("CdLearningEvent.FINALIZE_PENDING") &&
      /\bsnap\s*:/.test(call[0])
    ) {
      violations.push(`${rel(file)} must pass globalTurn/readySkillIds, not snap, to CD finalize`);
    }
  }
  if (
    relative !== owner &&
    /CdLearningEvent\.FINALIZE_PENDING[\s\S]{0,220}\bsnap:\s*\{[\s\S]{0,120}\bskillReady\s*:/.test(
      source
    )
  ) {
    violations.push(`${rel(file)} must pass readySkillIds, not full skillReady, to CD finalize`);
  }
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runCdLearningAutomation",
  "CdLearningEvent",
  "STORAGE_KEYS.LEARNED_CD",
  "OptionEvent.READ_FIELD",
  "normalizeTurn",
  "normalizePending",
  "normalizeReadySkillIds",
  "normalizeLearnedCdRecord",
  "readLearnedCdMap",
  "persistLearnedCd",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if ((ownerText.match(/normalizePending\(/g) || []).length < 3) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize pending CD learning state`);
}
if ((ownerText.match(/readLearnedCdMap\(/g) || []).length < 3) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize learned CD storage reads`);
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read option fields directly`);
}
const finalizeBody = ownerText.match(/function finalizeCdPending\(event\) \{[\s\S]*?\n\}/)?.[0];
if (
  !finalizeBody?.includes("event?.readySkillIds") ||
  !finalizeBody?.includes("event?.globalTurn")
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} finalize must consume narrow globalTurn/readySkillIds facts`
  );
}
if (
  /\bsnap\?\.globalTurn\b|\bsnap\.globalTurn\b|\bsnap\?\.readySkillIds\b|\bsnap\.readySkillIds\b|\bsnap\?\.skillReady\b|\bsnap\.skillReady\b/.test(
    finalizeBody || ""
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} finalize must not consume snap-shaped input`);
}
const recordBody = ownerText.match(
  /function recordCdFire\(code, id, globalTurn\) \{[\s\S]*?\n\}/
)?.[0];
if (!recordBody?.includes("normalizeTurn(globalTurn)")) {
  violations.push(`${owner.replaceAll("\\", "/")} record fire must consume direct globalTurn`);
}
if (/\bsnap\?\.globalTurn\b|\bsnap\.globalTurn\b/.test(recordBody || "")) {
  violations.push(`${owner.replaceAll("\\", "/")} record fire must not consume full snap`);
}

for (const legacy of ["recordCdFire", "finalizeCdPending", "getLearnedCd"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runCdLearningAutomation(event)`
    );
  }
}

if (!ownerText.includes("const cdLearningEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route CD learning events through a handler table`
  );
}
const ownerEntry = ownerText.match(/export function runCdLearningAutomation[\s\S]*?\n}/)?.[0] || "";
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
  );
}
if (ownerEntry.includes("event.type")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must reject null events without throwing`);
}
if (!ownerEntry.includes("event?.type")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null events`
  );
}
for (const internal of ["recordCdFire(", "finalizeCdPending(", "getLearnedCd("]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through cdLearningEventHandlers`
    );
  }
}
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
if (
  !ownerTestText.includes(
    "rejects unknown and null CD learning events without reading or changing learning state"
  ) ||
  !ownerTestText.includes("runCdLearningAutomation(null)") ||
  !ownerTestText.includes("getItem.mock.calls.length")
) {
  violations.push(
    `${ownerTest.replaceAll("\\", "/")} must cover unknown and null CD learning events`
  );
}

if ((ownerText.match(/\bsetValue\(/g) || []).length !== 0) {
  violations.push(`${owner.replaceAll("\\", "/")} must not write learned CD storage directly`);
}
if (
  !/function persistLearnedCd\(learned\) \{[\s\S]*setValue\(STORAGE_KEYS\.LEARNED_CD,\s*learned\);[\s\S]*return true;[\s\S]*catch\s*\(error\)\s*{[\s\S]*recordCdLearningFailure\("update-learned",\s*error\);[\s\S]*return false;/.test(
    failureOwnerText
  )
) {
  violations.push(
    `${failureOwner.replaceAll("\\", "/")} must classify learned CD storage write failures`
  );
}
for (const required of [
  "CD_LEARNING_FAILURE_KEY",
  "HVAA:lastCdLearningFailure",
  "recordCdLearningFailure",
  "cdLearning",
  "persistLearnedCd",
  "STORAGE_KEYS.LEARNED_CD",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "CD_LEARNING_FAILURE_KEY",
  "update-learned",
  "storageWrite",
  "cd learning write blocked",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-cd-learner-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-cd-learner-boundary] OK — CD learning is behind one entry");
