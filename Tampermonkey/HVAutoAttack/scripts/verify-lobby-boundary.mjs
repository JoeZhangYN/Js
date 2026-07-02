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
  for (const required of [
    "lobbyEventHandlers",
    "LOBBY_READY_FLOW_STEPS",
    "clearBattleSession",
    "refreshLobbyDayRecord",
    "captureLobbyAbilityPage",
    "runQuickSiteLobbyReady",
    "handleLobbyEncounter",
    "stopWhenStaminaRequires",
    "runNextBattleAutomation",
    "runLobbyReadyFlow",
    "rerunLobbyPageReady",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(lobbyFile)} must name lobby-ready flow step ${required}`);
    }
  }
  if (
    !/const LOBBY_READY_FLOW_STEPS = \[\s*clearBattleSession,\s*refreshLobbyDayRecord,\s*captureLobbyAbilityPage,\s*runQuickSiteLobbyReady,\s*handleLobbyEncounter,\s*stopWhenStaminaRequires,\s*runNextBattleAutomation,\s*\]/.test(
      text
    )
  ) {
    violations.push(`${rel(lobbyFile)} must own explicit lobby-ready flow order`);
  }
  const entryBody =
    text.match(/export async function runLobbyAutomation\(event = \{ type: EVENT_PAGE_READY \}\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/const lobbyEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_PAGE_READY\]/.test(text)) {
    violations.push(`${rel(lobbyFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*(?:!==|===)|switch\s*\(\s*event\.type\s*\)/.test(entryBody)) {
    violations.push(`${rel(lobbyFile)} entry must dispatch by handler table`);
  }
  if (entryBody.includes("event.type") || !entryBody.includes("event?.type")) {
    violations.push(`${rel(lobbyFile)} entry must fail closed for unknown or null lobby events`);
  }
  for (const forbidden of [
    "runBattleRuntimeAutomation",
    "runDayRecordAutomation",
    "runAbilityAoeAutomation",
    "runQuickSiteAutomation",
    "runEncounterAutomation",
    "runRepairAutomation",
    "runIdleArenaAutomation",
  ]) {
    if (entryBody.includes(forbidden)) {
      violations.push(`${rel(lobbyFile)} entry must route page ready through lobby flow steps`);
    }
  }
  if (!text.includes("LobbyEvent") || !text.includes("EVENT_PAGE_READY")) {
    violations.push(`${rel(lobbyFile)} must own LobbyEvent.PAGE_READY wiring`);
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(lobbyFile)} must read lobby option switches through option entry`);
  }
  if (/from\s+["']\.\.\/state\/store\.js["']/.test(text)) {
    violations.push(`${rel(lobbyFile)} must not import store for lobby option switches`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(lobbyFile)} must not read option fields directly`);
  }
  if (/runQuickSiteAutomation\(\s*\{[^}]*\boption\s*:/s.test(text)) {
    violations.push(`${rel(lobbyFile)} must not pass option objects into quick site`);
  }
  if (/rerun:\s*runLobbyAutomation\b/.test(text)) {
    violations.push(`${rel(lobbyFile)} encounter rerun must report LobbyEvent.PAGE_READY`);
  }
  if (!/function rerunLobbyPageReady\(\) \{\s*return runLobbyAutomation\(\{ type: EVENT_PAGE_READY \}\);\s*\}/.test(text)) {
    violations.push(`${rel(lobbyFile)} rerun must report LobbyEvent.PAGE_READY through one helper`);
  }
  const lobbyTestFile = path.join(root, "src/pages/lobby-automation.test.js");
  const lobbyTestText = fs.existsSync(lobbyTestFile) ? fs.readFileSync(lobbyTestFile, "utf8") : "";
  if (
    !lobbyTestText.includes("rejects invalid lobby events without running lobby flow") ||
    !lobbyTestText.includes("runLobbyAutomation(null)")
  ) {
    violations.push(`${rel(lobbyTestFile)} must cover unknown and null lobby events`);
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
