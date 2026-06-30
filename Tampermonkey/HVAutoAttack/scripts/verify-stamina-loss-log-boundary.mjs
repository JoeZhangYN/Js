import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/stamina-loss-log.js");
const ownerTest = path.normalize("src/state/stamina-loss-log.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const settingsRender = path.normalize("src/settings/render.js");
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
    if (
      relative === settingsRender &&
      /\bStaminaLossLogEvent\.READ\b|\bconst\s+staminaLostLog\b|There are .* logs/.test(line)
    ) {
      violations.push(`${where} settings must not compose stamina loss log reset message`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runStaminaLossLogAutomation",
  "StaminaLossLogEvent",
  "STORAGE_KEYS.STAMINA_LOST_LOG",
  "CLEAR_CONFIRMATION_MESSAGE",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
if (!settingsText.includes("StaminaLossLogEvent.CLEAR_CONFIRMATION_MESSAGE")) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must request stamina loss log reset message`
  );
}

for (const legacy of ["readStaminaLossLog", "recordStaminaLoss", "clearStaminaLossLog"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runStaminaLossLogAutomation(event)`
    );
  }
}

if (!ownerText.includes("const staminaLossLogEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route stamina loss log events through a handler table`
  );
}
const ownerEntry =
  ownerText.match(/export function runStaminaLossLogAutomation[\s\S]*?\n}/)?.[0] || "";
if (/if\s*\(\s*event\.type\s*===/.test(ownerEntry)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`);
}
for (const internal of [
  "readStaminaLossLog(",
  "recordStaminaLoss(",
  "clearStaminaLossLog(",
  "staminaLossClearConfirmationMessage(",
]) {
  if (ownerEntry.includes(internal)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must dispatch through staminaLossLogEventHandlers`
    );
  }
}

if (violations.length) {
  console.error("[verify-stamina-loss-log-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-stamina-loss-log-boundary] OK — stamina loss log is behind one entry");
