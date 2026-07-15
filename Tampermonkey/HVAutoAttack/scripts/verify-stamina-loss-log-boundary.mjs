import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/stamina-loss-log.js");
const failureOwner = path.normalize("src/state/stamina-loss-log-failure.js");
const ownerTest = path.normalize("src/state/stamina-loss-log.test.js");
const failureTest = path.normalize("src/state/stamina-loss-log-failure.test.js");
const storeOwner = path.normalize("src/state/stamina-loss-store.js");
const adapterOwner = path.normalize("src/state/stamina-loss-store-indexeddb.js");
const adapterTest = path.normalize("src/state/stamina-loss-store-indexeddb.test.js");
const maintenanceOwner = path.normalize("src/state/storage-maintenance-record-sources.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const settingsRender = path.normalize("src/settings/render.js");
const settingsCommand = path.normalize("src/settings/stamina-loss-log-command.js");
const settingsCommandTest = path.normalize("src/settings/stamina-loss-log-command.test.js");
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
      relative !== settingsCommand &&
      relative !== settingsCommandTest &&
      relative !== maintenanceOwner &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.STAMINA_LOST_LOG\b/.test(line)
    ) {
      violations.push(`${where} stamina loss log storage belongs in state/stamina-loss-log.js`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      /\b(?:getValue|setValue|delValue)\(\s*["']staminaLostLog["']/.test(line)
    ) {
      violations.push(`${where} stamina loss log storage must use stamina loss log entry`);
    }
    if (
      relative === settingsRender &&
      /\bStaminaLossLogEvent\b|\brunStaminaLossLogAutomation\b|\bconst\s+staminaLostLog\b|There are .* logs/.test(
        line
      )
    ) {
      violations.push(`${where} settings must not compose stamina loss log reset message`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
for (const required of [
  "runStaminaLossLogAutomation",
  "StaminaLossLogEvent",
  "CLEAR_CONFIRMATION_MESSAGE",
  "StaminaLossStoreEvent.APPEND",
  "StaminaLossStoreEvent.LIST",
  "StaminaLossStoreEvent.CLEAR",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (ownerText.includes("STORAGE_KEYS.STAMINA_LOST_LOG")) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read compatibility aggregates`);
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
if (!settingsText.includes("SettingsStaminaLossLogCommandEvent.CLEAR_CONFIRMATION_MESSAGE")) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must request stamina loss log reset message through settings command`
  );
}
if (!settingsText.includes("SettingsStaminaLossLogCommandEvent.CLEAR")) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must clear stamina loss log through settings command`
  );
}
const settingsCommandText = fs.readFileSync(path.join(root, settingsCommand), "utf8");
for (const required of [
  "SettingsStaminaLossLogCommandEvent",
  "runSettingsStaminaLossLogCommand",
  "StaminaLossLogEvent.CLEAR_CONFIRMATION_MESSAGE",
  "StaminaLossLogEvent.CLEAR",
  "const settingsStaminaLossLogCommandHandlers",
]) {
  if (!settingsCommandText.includes(required)) {
    violations.push(`${settingsCommand.replaceAll("\\", "/")} must expose ${required}`);
  }
}
const settingsCommandTestText = fs.readFileSync(path.join(root, settingsCommandTest), "utf8");
for (const required of [
  "settings stamina loss log command entry",
  "renders the clear confirmation message through one settings command",
  "clears stamina loss logs as a typed settings command",
  "fails closed for unknown stamina loss log commands",
]) {
  if (!settingsCommandTestText.includes(required)) {
    violations.push(`${settingsCommandTest.replaceAll("\\", "/")} must cover ${required}`);
  }
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
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
  );
}
if (/\bevent\.type\b/.test(ownerEntry) || !/\bevent\?\.type\b/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for null stamina loss log events`
  );
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
if (!/runStaminaLossLogAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null stamina loss log events`);
}

if (/\bsetValue\(/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not write stamina loss log storage directly`
  );
}
for (const required of [
  "STAMINA_LOSS_LOG_FAILURE_KEY",
  "HVAA:lastStaminaLossLogFailure",
  "recordStaminaLossLogFailure",
  "staminaLossLog",
  "storageWrite",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "STAMINA_LOSS_LOG_FAILURE_KEY",
  "stamina append blocked",
  "stamina clear blocked",
  "StorageWriteOutcome.FAILED",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

const storeText = fs.readFileSync(path.join(root, storeOwner), "utf8");
for (const required of [
  "StorageIdentity.STAMINA_LOSS",
  "createStaminaLossIndexedDbAdapter",
  "CURRENT_WORLD_POLICY.staminaLoss",
  "StorageWriteOutcome.FAILED",
]) {
  if (!storeText.includes(required)) {
    violations.push(`${storeOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}

const adapterText = fs.readFileSync(path.join(root, adapterOwner), "utf8");
for (const required of [
  "budget.days * DAY_MILLISECONDS",
  "retained.length >= budget.compactAt",
  "retained.slice(0, -budget.rows)",
]) {
  if (!adapterText.includes(required)) {
    violations.push(`${adapterOwner.replaceAll("\\", "/")} must enforce ${required}`);
  }
}

const adapterTestText = fs.readFileSync(path.join(root, adapterTest), "utf8");
for (const required of [
  "expires records older than 365 days during append",
  "compacts at 1100 records and retains the newest 1000",
  "isolates histories by world database name",
]) {
  if (!adapterTestText.includes(required)) {
    violations.push(`${adapterTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-stamina-loss-log-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-stamina-loss-log-boundary] OK — stamina loss log is behind one entry");
