import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/stamina.js");
const ownerTest = path.normalize("src/state/stamina.test.js");
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
      /from\s+["'](?:\.\/|\.\.\/state\/|\.\.\/\.\.\/state\/)stamina\.js["']/.test(line) &&
      /\breadStaminaValue\b/.test(line)
    ) {
      violations.push(`${where} legacy stamina value import is forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /restoreStamina/.test(line) &&
      /staminaLow/.test(line)
    ) {
      violations.push(
        `${where} stamina restore/stop decision belongs in runStaminaAutomation(event)`
      );
    }
    if (relative !== owner && relative !== ownerTest && /recover=stamina/.test(line)) {
      violations.push(`${where} stamina recovery POST belongs in runStaminaAutomation(event)`);
    }
    if (relative === owner && /\bg\(\s*["']option["']/.test(line)) {
      violations.push(`${where} stamina decisions must read options through option entry`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runStaminaAutomation",
  "StaminaEvent",
  "OptionEvent.READ_FIELD",
  "CLAIM_RECOVERY",
  "STAMINA_RECOVERY_POST_BODY",
  "NavigationEvent.RELOAD_NOW",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

if (!/const\s+STAMINA_RECOVERY_POST_BODY\s*=\s*"recover=stamina"/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must define stamina recovery POST body`);
}

if (/export\s+function\s+readStaminaValue\s*\(/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} legacy readStaminaValue export must stay private behind runStaminaAutomation(event)`
  );
}

if (violations.length) {
  console.error("[verify-stamina-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-stamina-boundary] OK — stamina value and restore decisions are behind one entry"
);
