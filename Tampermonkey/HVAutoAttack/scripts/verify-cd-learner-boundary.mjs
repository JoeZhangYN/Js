import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/cd-learner.js");
const ownerTest = path.normalize("src/state/cd-learner.test.js");
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
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /from\s+["'](?:\.\/|\.\.\/\.\.\/state\/|\.\.\/state\/)cd-learner\.js["']/.test(line) &&
      /\b(?:recordCdFire|finalizeCdPending|getLearnedCd)\b/.test(line)
    ) {
      violations.push(`${where} legacy CD learner imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.LEARNED_CD\b/.test(line)
    ) {
      violations.push(`${where} learned CD storage belongs in cd learner`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runCdLearningAutomation",
  "CdLearningEvent",
  "STORAGE_KEYS.LEARNED_CD",
  "OptionEvent.READ_FIELD",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read option fields directly`);
}

for (const legacy of ["recordCdFire", "finalizeCdPending", "getLearnedCd"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runCdLearningAutomation(event)`
    );
  }
}

if (violations.length) {
  console.error("[verify-cd-learner-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-cd-learner-boundary] OK — CD learning is behind one entry");
