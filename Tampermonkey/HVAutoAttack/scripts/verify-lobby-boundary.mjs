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
        `${rel(initFile)}:${index + 1} lobby business belongs in runLobbyAutomation(event)`
      );
    }
  });
}

function checkLobbyEntry() {
  const text = fs.readFileSync(lobbyFile, "utf8");
  if (!/export const LobbyEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(lobbyFile)} must expose LobbyEvent`);
  }
  if (!/export async function runLobbyAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(lobbyFile)} must expose runLobbyAutomation(event)`);
  }
  if (/export async function runLobbyAutomation\(\s*\)/.test(text)) {
    violations.push(`${rel(lobbyFile)} must not expose no-arg lobby entry`);
  }
  if (!/await runEncounterAutomation\(/.test(text)) {
    violations.push(
      `${rel(lobbyFile)} must await encounter workflow before repair/idle automation`
    );
  }
  if (!text.includes("LobbyEvent") || !text.includes("EVENT_PAGE_READY")) {
    violations.push(`${rel(lobbyFile)} must own LobbyEvent.PAGE_READY wiring`);
  }
  if (/rerun:\s*runLobbyAutomation\b/.test(text)) {
    violations.push(`${rel(lobbyFile)} encounter rerun must report LobbyEvent.PAGE_READY`);
  }
  const pageText = fs.readFileSync(path.join(root, "src/pages/page-automation.js"), "utf8");
  if (!pageText.includes("LobbyEvent.PAGE_READY")) {
    violations.push("src/pages/page-automation.js must report LobbyEvent.PAGE_READY");
  }
  if (/runLobbyAutomation\(\s*\)/.test(pageText)) {
    violations.push("src/pages/page-automation.js must not call no-arg lobby entry");
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
