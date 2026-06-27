import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/pages/ability-page.js");
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
    if (/\b(?:getValue|setValue)\(\s*["']spellAoe["']/.test(line)) {
      violations.push(`${where} spellAoe storage belongs in runAbilityAoeAutomation(event)`);
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
  if (!/export function runAbilityAoeAutomation\(/.test(text)) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose runAbilityAoeAutomation(event)`);
  }
  if (/export function parseAbilityPage\(/.test(text)) {
    violations.push(`${owner.replaceAll("\\", "/")} must keep parseAbilityPage internal`);
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
