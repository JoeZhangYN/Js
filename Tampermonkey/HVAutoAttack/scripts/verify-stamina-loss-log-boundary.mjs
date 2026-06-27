import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/stamina-loss-log.js");
const ownerTest = path.normalize("src/state/stamina-loss-log.test.js");
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
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.STAMINA_LOST_LOG\b/.test(line)
    ) {
      violations.push(`${where} stamina loss log storage belongs in state/stamina-loss-log.js`);
    }
    if (
      relative !== owner &&
      /\b(?:getValue|setValue|delValue)\(\s*["']staminaLostLog["']/.test(line)
    ) {
      violations.push(`${where} stamina loss log storage must use stamina loss log entry`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "readStaminaLossLog",
  "recordStaminaLoss",
  "clearStaminaLossLog",
  "STORAGE_KEYS.STAMINA_LOST_LOG",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-stamina-loss-log-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-stamina-loss-log-boundary] OK — stamina loss log is behind one entry");
