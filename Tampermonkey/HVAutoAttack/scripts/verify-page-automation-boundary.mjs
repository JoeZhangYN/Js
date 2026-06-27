import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const entryFile = path.join(root, "src/pages/page-automation.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkInit() {
  const lines = fs.readFileSync(initFile, "utf8").split(/\r?\n/);
  const forbidden = [
    /\bPageKind\b/,
    /\bscheduleReload\b/,
    /\brunEquipmentViewAutomation\b/,
    /\brunCrossSiteEncounterNavigation\b/,
    /\brunRiddleAutomation\b/,
    /\brunBattleAutomation\b/,
    /\brunLobbyAutomation\b/,
    /\brunPageRefreshAutomation\b/,
    /\bGAME_PAGE_READY\b/,
  ];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runPageAutomation")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} page routing belongs in runPageAutomation(kind)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(entryFile, "utf8");
  if (!/export function runPageAutomation\(\s*kind\s*\)/.test(text)) {
    violations.push(`${rel(entryFile)} must expose runPageAutomation(kind)`);
  }
  for (const required of [
    "runEquipmentViewAutomation",
    "runCrossSiteEncounterNavigation",
    "AppStartupEvent.GAME_PAGE_READY",
    "runRiddleAutomation",
    "runBattleAutomation",
    "runLobbyAutomation",
    "runPageRefreshAutomation",
    "PageRefreshEvent.UNKNOWN_PAGE_READY",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(entryFile)} must own ${required} page routing wiring`);
    }
  }
  if (/\bscheduleReload\b/.test(text)) {
    violations.push(`${rel(entryFile)} must route page reload scheduling through runPageRefreshAutomation(event)`);
  }
}

checkInit();
checkEntry();

if (violations.length) {
  console.error("[verify-page-automation-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-page-automation-boundary] OK — page automation routing is behind one entry");
