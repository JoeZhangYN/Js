import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/battle/battle-stamina.js");
const ownerTest = path.normalize("src/battle/battle-stamina.test.js");
const logOwner = path.normalize("src/state/stamina-loss-log.js");
const logOwnerTest = path.normalize("src/state/stamina-loss-log.test.js");
const settings = path.normalize("src/settings/render.js");
const settingsSchema = path.normalize("src/settings/schema.js");
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== settings &&
      relative !== settingsSchema &&
      !relative.startsWith(path.normalize("src/settings/schema-")) &&
      /You lose .*Stamina|staminaLose\b/.test(line)
    ) {
      violations.push(
        `${where} stamina loss decision belongs in runBattleStaminaAutomation(event)`
      );
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== logOwner &&
      relative !== logOwnerTest &&
      relative !== settings &&
      /\brecordStaminaLoss\b/.test(line)
    ) {
      violations.push(`${where} stamina loss recording must use battle-stamina boundary`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runBattleStaminaAutomation",
  "battleStaminaEventHandlers",
  "ROUND_LOG_READY",
  "STAMINA_LOSS_THRESHOLD_OPTION_KEY",
  "DEFAULT_STAMINA_LOSS_THRESHOLD",
  "OptionEvent.READ_FIELD",
  "runStaminaLossLogAutomation",
  "StaminaLossLogEvent.RECORD",
  "runBattlePauseAutomation",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must read stamina options through option entry`);
}
if (/key:\s*["']staminaLose["']/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must use stamina threshold option key constant`);
}
if (/fallback:\s*Number\.POSITIVE_INFINITY/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must use stamina threshold fallback constant`);
}
const entryBody =
  ownerText.match(/export function runBattleStaminaAutomation\([^)]*\)[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_ROUND_LOG_READY\]/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route events through a frozen handler table`
  );
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (/battleStaminaEventHandlers\[event\.type\]/.test(entryBody)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for invalid stamina events`
  );
}
if (!/battleStaminaEventHandlers\[event\?\.type\]/.test(entryBody)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must dispatch invalid stamina events through optional type`
  );
}
if (fs.existsSync(path.join(root, ownerTest))) {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (!ownerTestText.includes("rejects invalid battle stamina events without side effects")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover invalid battle stamina events`);
  }
  if (!/runBattleStaminaAutomation\(null/.test(ownerTestText)) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null battle stamina events`);
  }
}

if (violations.length) {
  console.error("[verify-battle-stamina-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-stamina-boundary] OK — battle stamina loss decision is behind one entry"
);
