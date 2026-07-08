import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/pages/ability-page.js");
const failureOwner = path.normalize("src/pages/ability-aoe-failure.js");
const ownerTest = path.normalize("src/pages/ability-page.test.js");
const failureTest = path.normalize("src/pages/ability-aoe-failure.test.js");
const startupFile = path.join(root, "src/pages/app-startup.js");
const lobbyFile = path.join(root, "src/pages/lobby-automation.js");
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
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      /\b(?:getValue|setValue)\(\s*["']spellAoe["']/.test(line)
    ) {
      violations.push(`${where} spellAoe storage belongs in runAbilityAoeAutomation(event)`);
    }
    if (
      relative !== owner &&
      relative !== failureOwner &&
      relative !== ownerTest &&
      relative !== failureTest &&
      /\bSTORAGE_KEYS\.SPELL_AOE\b/.test(line)
    ) {
      violations.push(`${where} spellAoe storage key belongs in runAbilityAoeAutomation(event)`);
    }
    if (relative !== owner && /\bparseAbilityPage\b/.test(line)) {
      violations.push(`${where} parseAbilityPage is internal; use runAbilityAoeAutomation(event)`);
    }
    if (
      relative !== owner &&
      /\bURLSearchParams\b/.test(line) &&
      relative.endsWith("lobby-automation.js")
    ) {
      violations.push(`${where} ability page detection belongs in runAbilityAoeAutomation(event)`);
    }
    if (relative === owner && /\bg\(\s*["']option["']/.test(line)) {
      violations.push(`${where} ability AoE option sync must use runOptionAutomation(event)`);
    }
  });
}

function checkCallers() {
  const startup = fs.readFileSync(startupFile, "utf8");
  if (!startup.includes("AbilityAoeEvent.LOAD_STORED_AOE")) {
    violations.push(`${rel(startupFile)} must load AoE through runAbilityAoeAutomation(event)`);
  }
  const lobby = fs.readFileSync(lobbyFile, "utf8");
  if (!lobby.includes("AbilityAoeEvent.CAPTURE_ABILITY_PAGE")) {
    violations.push(
      `${rel(lobbyFile)} must capture ability AoE through runAbilityAoeAutomation(event)`
    );
  }
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, owner), "utf8");
  const failureText = fs.readFileSync(path.join(root, failureOwner), "utf8");
  const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
  if (!/export function runAbilityAoeAutomation\(/.test(text)) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose runAbilityAoeAutomation(event)`);
  }
  if (!text.includes("READ_SPELL_AOE")) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose READ_SPELL_AOE`);
  }
  if (!text.includes("const abilityAoeEventHandlers")) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must route ability AoE events through a handler table`
    );
  }
  const entryMatch = text.match(/export function runAbilityAoeAutomation[\s\S]*?\n}/);
  if (!entryMatch) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose runAbilityAoeAutomation(event)`);
  } else {
    const entryBody = entryMatch[0];
    if (entryBody.includes("event.type")) {
      violations.push(
        `${owner.replaceAll("\\", "/")} entry must reject null events without throwing`
      );
    }
    if (!entryBody.includes("event?.type")) {
      violations.push(
        `${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null events`
      );
    }
    if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
      violations.push(
        `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
      );
    }
    for (const internal of ["loadStoredAoe(", "parseAbilityPage(", "readSpellAoe("]) {
      if (entryBody.includes(internal)) {
        violations.push(
          `${owner.replaceAll("\\", "/")} entry must dispatch through abilityAoeEventHandlers`
        );
      }
    }
  }
  for (const required of ["OptionEvent.READ_FIELD", "OptionEvent.WRITE_FIELD"]) {
    if (!text.includes(required)) {
      violations.push(`${owner.replaceAll("\\", "/")} must sync option AoE through ${required}`);
    }
  }
  for (const required of [
    "DiagnosticConsoleEvent.INFO",
    "runDiagnosticConsoleAutomation",
    "recordAbilityAoeDiagnostic",
    'capability: "abilityAoe"',
  ]) {
    if (!text.includes(required)) {
      violations.push(`${owner.replaceAll("\\", "/")} must route diagnostics through ${required}`);
    }
  }
  if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(text)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must route Ability AoE diagnostics through the typed diagnostic console entry`
    );
  }
  if (/export function parseAbilityPage\(/.test(text)) {
    violations.push(`${owner.replaceAll("\\", "/")} must keep parseAbilityPage internal`);
  }
  for (const required of [
    "ABILITY_AOE_FAILURE_KEY",
    "HVAA:lastAbilityAoeFailure",
    "persistAbilitySpellAoe",
    "recordAbilityAoeFailure",
    "storageWrite",
    "abilityAoe",
  ]) {
    if (!failureText.includes(required)) {
      violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  for (const required of [
    "does not report capture success or sync option when spell AoE persistence fails",
    "records option sync failure after authoritative spell AoE capture succeeds",
    "keeps failure fallback from throwing when evidence and warning both fail",
    "ABILITY_AOE_FAILURE_KEY",
  ]) {
    if (!failureTestText.includes(required)) {
      violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  const testText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (
    !testText.includes(
      "rejects unknown and null ability AoE events without reading or writing state"
    ) ||
    !testText.includes("runAbilityAoeAutomation(null)")
  ) {
    violations.push(
      `${ownerTest.replaceAll("\\", "/")} must cover unknown and null ability AoE events`
    );
  }
  if (!testText.includes("runDiagnosticConsoleAutomation")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover typed Ability AoE diagnostics`);
  }
}

walk(srcDir);
checkCallers();
checkEntry();

if (violations.length) {
  console.error("[verify-ability-aoe-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-ability-aoe-boundary] OK — ability AoE state has one owner");
