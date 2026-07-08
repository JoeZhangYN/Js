import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/recovery-learner.js");
const failureOwner = path.normalize("src/state/recovery-learner-failure.js");
const ownerTest = path.normalize("src/state/recovery-learner.test.js");
const failureTest = path.normalize("src/state/recovery-learner-failure.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const potionEconomy = path.normalize("src/battle/potion-economy.js");
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
      /from\s+["'](?:\.\/|\.\.\/\.\.\/state\/|\.\.\/state\/)recovery-learner\.js["']/.test(line) &&
      /\b(?:recordPreDrink|finalizePending|getLearnedRecovery)\b/.test(line)
    ) {
      violations.push(`${where} legacy recovery learner imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.LEARNED_RECOVERY\b/.test(line)
    ) {
      violations.push(`${where} learned recovery storage belongs in recovery learner`);
    }
    if (relative === owner && /from\s+["']\.\.\/battle\//.test(line)) {
      violations.push(`${where} recovery learner must not depend on battle internals`);
    }
    if (relative === potionEconomy && /\bPOTION_RECOVERY\b/.test(line)) {
      violations.push(`${where} battle fallback recovery belongs in recovery learner`);
    }
    if (
      relative !== potionEconomy &&
      /from\s+["'][^"']*potion-economy\.js["']/.test(line) &&
      /\bisPotionWasteful\b/.test(line)
    ) {
      violations.push(
        `${where} potion economy must be consumed through runBattlePotionEconomy(event)`
      );
    }
  });
  if (
    relative !== owner &&
    /RecoveryLearningEvent\.(?:RECORD_PRE_DRINK|FINALIZE_PENDING)[\s\S]{0,220}\bsnap:\s*\{[\s\S]{0,140}\b(?:hpAbs|mpAbs|spAbs)\s*:/.test(
      source
    )
  ) {
    violations.push(`${rel(file)} must pass recoveryAbs, not raw vitals, to recovery learning`);
  }
  for (const call of source.matchAll(/runRecoveryLearningAutomation\(\s*\{[\s\S]*?\}\s*\)/g)) {
    if (
      relative !== owner &&
      call[0].includes("RecoveryLearningEvent.RECORD_PRE_DRINK") &&
      /\bsnap\s*:/.test(call[0])
    ) {
      violations.push(`${rel(file)} must pass recoveryAbs, not snap, to recovery record pre-drink`);
    }
    if (
      relative !== owner &&
      call[0].includes("RecoveryLearningEvent.FINALIZE_PENDING") &&
      /\bsnap\s*:/.test(call[0])
    ) {
      violations.push(`${rel(file)} must pass recoveryAbs, not snap, to recovery finalize`);
    }
  }
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const potionEconomyText = fs.readFileSync(path.join(root, potionEconomy), "utf8");
for (const required of [
  "BattlePotionEconomyEvent",
  "runBattlePotionEconomy",
  "IS_WASTEFUL",
  "battlePotionEconomyEventHandlers",
  "isPotionWasteful",
]) {
  if (!potionEconomyText.includes(required)) {
    violations.push(`${potionEconomy.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattlePotionEconomyEvent\b|runBattlePotionEconomy\b)/.test(
    potionEconomyText
  )
) {
  violations.push(`${potionEconomy.replaceAll("\\", "/")} may export only its event query entry`);
}
if (/battlePotionEconomyEventHandlers\[event\.type\]/.test(potionEconomyText)) {
  violations.push(`${potionEconomy.replaceAll("\\", "/")} must reject null potion economy events`);
}
if (!/battlePotionEconomyEventHandlers\[event\?\.type\]/.test(potionEconomyText)) {
  violations.push(
    `${potionEconomy.replaceAll("\\", "/")} must dispatch invalid potion economy events through optional type`
  );
}
const potionEconomyTest = path.normalize("src/battle/potion-economy.test.js");
const potionEconomyTestText = fs.readFileSync(path.join(root, potionEconomyTest), "utf8");
if (!/runBattlePotionEconomy\(null\)/.test(potionEconomyTestText)) {
  violations.push(
    `${potionEconomyTest.replaceAll("\\", "/")} must cover null potion economy events`
  );
}
for (const required of [
  "runRecoveryLearningAutomation",
  "RecoveryLearningEvent",
  "STORAGE_KEYS.LEARNED_RECOVERY",
  "OptionEvent.READ_FIELD",
  "RECOVERY_PRIOR",
  "normalizePotionId",
  "normalizePending",
  "normalizeRecoveryAbs",
  "normalizeLearnedRecoveryRecord",
  "readLearnedRecoveryMap",
  "persistLearnedRecovery",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read option fields directly`);
}
if (
  /\bsnap\?\.\[\s*`\$\{info\.stat\}Abs`\s*\]|\bsnap\?\.\[\s*`\$\{pending\.stat\}Abs`\s*\]/.test(
    ownerText
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must consume recoveryAbs, not raw snapshot vitals`
  );
}
const finalizeBody = ownerText.match(/function finalizePending\(event\) \{[\s\S]*?\n\}/)?.[0];
if (!finalizeBody?.includes("event?.recoveryAbs")) {
  violations.push(`${owner.replaceAll("\\", "/")} finalize must consume direct recoveryAbs`);
}
if (/\bsnap\?\.recoveryAbs\b|\bsnap\.recoveryAbs\b/.test(finalizeBody || "")) {
  violations.push(`${owner.replaceAll("\\", "/")} finalize must not consume snap-shaped input`);
}
const recordBody = ownerText.match(
  /function recordPreDrink\(potionId, recoveryAbs\) \{[\s\S]*?\n\}/
)?.[0];
if (!recordBody?.includes("normalizeRecoveryAbs(recoveryAbs)")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} record pre-drink must consume direct recoveryAbs`
  );
}
if (/\bsnap\?\.recoveryAbs\b|\bsnap\.recoveryAbs\b/.test(recordBody || "")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} record pre-drink must not consume snap-shaped input`
  );
}

for (const legacy of ["recordPreDrink", "finalizePending", "getLearnedRecovery"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runRecoveryLearningAutomation(event)`
    );
  }
}

if ((ownerText.match(/\bnormalizePending\(/g) || []).length < 3) {
  violations.push(
    `${owner.replaceAll("\\", "/")} pending recovery state must be normalized on record and finalize paths`
  );
}
if ((ownerText.match(/\breadLearnedRecoveryMap\(/g) || []).length < 3) {
  violations.push(
    `${owner.replaceAll("\\", "/")} learned recovery storage must be read through its normalized map`
  );
}

if (!ownerText.includes("const recoveryLearningEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route recovery learning events through a handler table`
  );
}
const ownerEntry =
  ownerText.match(/export function runRecoveryLearningAutomation[\s\S]*?\n}/)?.[0] || "";
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
  );
}
if (/\bevent\.type\b/.test(ownerEntry) || !/\bevent\?\.type\b/.test(ownerEntry)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for null recovery events`);
}
for (const internal of ["recordPreDrink(", "finalizePending(", "getLearnedRecovery("]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through recoveryLearningEventHandlers`
    );
  }
}
if (!/runRecoveryLearningAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null recovery learning events`);
}

if (
  !/function persistLearnedRecovery\(learned\) \{[\s\S]*setValue\(STORAGE_KEYS\.LEARNED_RECOVERY,\s*learned\);[\s\S]*return true;[\s\S]*catch\s*\(error\)\s*{[\s\S]*recordRecoveryLearningFailure\("update-learned",\s*error\);[\s\S]*return false;/.test(
    failureOwnerText
  )
) {
  violations.push(
    `${failureOwner.replaceAll("\\", "/")} must classify learned recovery storage write failures`
  );
}
if ((ownerText.match(/\bsetValue\(/g) || []).length !== 0) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not write learned recovery storage directly`
  );
}
for (const required of [
  "RECOVERY_LEARNING_FAILURE_KEY",
  "HVAA:lastRecoveryLearningFailure",
  "recordRecoveryLearningFailure",
  "recoveryLearning",
  "persistLearnedRecovery",
  "STORAGE_KEYS.LEARNED_RECOVERY",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "RECOVERY_LEARNING_FAILURE_KEY",
  "update-learned",
  "storageWrite",
  "recovery learning write blocked",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-recovery-learner-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-recovery-learner-boundary] OK — recovery learning is behind one entry");
