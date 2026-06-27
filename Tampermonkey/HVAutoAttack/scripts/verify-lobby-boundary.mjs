import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const lobbyFile = path.join(root, "src/pages/lobby-automation.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkInit() {
  const text = fs.readFileSync(initFile, "utf8");
  const lines = text.split(/\r?\n/);
  const forbidden = [
    /\bparseAbilityPage\b/,
    /\bquickSite\b/,
    /\brunRepair\b/,
    /\brunIdleArenaAutomation\b/,
    /\brunEncounterAutomation\b/,
    /\breadStaminaValue\b/,
    /\bURLSearchParams\b/,
  ];
  lines.forEach((line, index) => {
    if (line.includes("runLobbyAutomation")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} lobby business belongs in runLobbyAutomation()`
      );
    }
  });
}

function checkLobbyEntry() {
  const text = fs.readFileSync(lobbyFile, "utf8");
  if (!/export async function runLobbyAutomation\(/.test(text)) {
    violations.push(`${rel(lobbyFile)} must expose runLobbyAutomation()`);
  }
  if (!/await runEncounterAutomation\(/.test(text)) {
    violations.push(
      `${rel(lobbyFile)} must await encounter workflow before repair/idle automation`
    );
  }
}

checkInit();
checkLobbyEntry();

if (violations.length) {
  console.error("[verify-lobby-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-lobby-boundary] OK — lobby workflow is behind one entry");
