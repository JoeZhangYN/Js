import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/recovery-learner.js");
const ownerTest = path.normalize("src/state/recovery-learner.test.js");
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
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /from\s+["'](?:\.\/|\.\.\/\.\.\/state\/|\.\.\/state\/)recovery-learner\.js["']/.test(line) &&
      /\b(?:recordPreDrink|finalizePending|getLearnedRecovery)\b/.test(line)
    ) {
      violations.push(`${where} legacy recovery learner imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
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
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runRecoveryLearningAutomation",
  "RecoveryLearningEvent",
  "STORAGE_KEYS.LEARNED_RECOVERY",
  "OptionEvent.READ_FIELD",
  "RECOVERY_PRIOR",
  "normalizePotionId",
  "normalizePending",
  "normalizeLearnedRecoveryRecord",
  "readLearnedRecoveryMap",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read option fields directly`);
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

if (violations.length) {
  console.error("[verify-recovery-learner-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-recovery-learner-boundary] OK — recovery learning is behind one entry");
