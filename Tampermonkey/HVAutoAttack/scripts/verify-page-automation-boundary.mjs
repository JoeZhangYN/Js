import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const entryFile = path.join(root, "src/pages/page-automation.js");
const failureTestFile = path.join(root, "src/pages/page-automation-failure.test.js");
const diagnosticKeysFile = path.join(root, "src/core/diagnostic-evidence-keys.js");
const diagnosticTestFile = path.join(root, "src/core/diagnostic-evidence.test.js");
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
        `${rel(initFile)}:${index + 1} page routing belongs in runPageAutomation(event)`
      );
    }
  });
  const initText = fs.readFileSync(initFile, "utf8");
  if (!initText.includes("PageAutomationEvent.PAGE_READY")) {
    violations.push(`${rel(initFile)} must report PageAutomationEvent.PAGE_READY`);
  }
  if (/runPageAutomation\(\s*kind\s*\)/.test(initText)) {
    violations.push(`${rel(initFile)} must not call runPageAutomation(kind)`);
  }
}

function checkEntry() {
  const text = fs.readFileSync(entryFile, "utf8");
  if (!/export const PageAutomationEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(entryFile)} must expose PageAutomationEvent`);
  }
  if (!/export function runPageAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(entryFile)} must expose runPageAutomation(event)`);
  }
  if (/export function runPageAutomation\(\s*kind\s*\)/.test(text)) {
    violations.push(`${rel(entryFile)} must not expose raw kind-based page automation entry`);
  }
  for (const required of [
    "PageAutomationEvent",
    "PAGE_AUTOMATION_FAILURE_KEY",
    "EVENT_PAGE_READY",
    "pageAutomationEventHandlers",
    "recordPageAutomationFailure",
    "runPageReadyStep",
    "runEquipmentViewAutomation",
    "runCrossSiteEncounterNavigation",
    "AppStartupEvent.GAME_PAGE_READY",
    "runRiddleAutomation",
    "runBattleAutomation",
    "runLobbyAutomation",
    "runPageRefreshAutomation",
    "PageRefreshEvent.UNKNOWN_PAGE_READY",
    "GAME_PAGE_AUTOMATION",
    "PAGE_READY_FLOW_STEPS",
    "reportEquipmentViewPageReady",
    "handleCrossSiteEncounterPageReady",
    "handleUnknownPageReady",
    "runGamePageReadyAutomation",
    "runPageReadyFlow",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(entryFile)} must own ${required} page routing wiring`);
    }
  }
  if (
    !/const PAGE_READY_FLOW_STEPS = \[\s*\["reportEquipmentViewPageReady",\s*reportEquipmentViewPageReady\],[\s\S]*\["handleCrossSiteEncounterPageReady",\s*handleCrossSiteEncounterPageReady\],[\s\S]*\["handleUnknownPageReady",\s*handleUnknownPageReady\],[\s\S]*\["runGamePageReadyAutomation",\s*runGamePageReadyAutomation\],\s*\]/.test(
      text
    )
  ) {
    violations.push(`${rel(entryFile)} must own explicit page-ready routing order`);
  }
  if (
    !/\[PageKind\.RIDDLE\]: runRiddlePageAutomation[\s\S]*\[PageKind\.BATTLE\]: runBattlePageAutomation[\s\S]*\[PageKind\.LOBBY\]: runLobbyPageAutomation[\s\S]*\[PageKind\.ISEKAI_LOBBY\]: runIsekaiLobbyPageAutomation/.test(
      text
    )
  ) {
    violations.push(`${rel(entryFile)} must route game pages through GAME_PAGE_AUTOMATION`);
  }
  const entryBody =
    text.match(/export function runPageAutomation\(event = \{ type: EVENT_PAGE_READY \}\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/const pageAutomationEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_PAGE_READY\]/.test(text)) {
    violations.push(`${rel(entryFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*(?:!==|===)|switch\s*\(\s*event\.type\s*\)/.test(entryBody)) {
    violations.push(`${rel(entryFile)} entry must dispatch by handler table`);
  }
  if (entryBody.includes("pageAutomationEventHandlers[event.type]")) {
    violations.push(`${rel(entryFile)} entry must reject null page automation events without throwing`);
  }
  if (!entryBody.includes("pageAutomationEventHandlers[event?.type]") || !entryBody.includes("return false")) {
    violations.push(`${rel(entryFile)} entry must fail closed for unknown or null page automation events`);
  }
  for (const forbidden of [
    "runEquipmentViewAutomation",
    "runCrossSiteEncounterNavigation",
    "scheduleUnknownPageReload",
    "runGamePageAutomation",
  ]) {
    if (entryBody.includes(forbidden)) {
      violations.push(`${rel(entryFile)} entry must route page ready through flow steps`);
    }
  }
  const gameBody = text.match(/function runGamePageAutomation\(kind\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (/kind\s*===\s*PageKind\.(?:RIDDLE|BATTLE|LOBBY)|else\s*\{/.test(gameBody)) {
    violations.push(`${rel(entryFile)} must not route game pages through if/else`);
  }
  if (/\bscheduleReload\b/.test(text)) {
    violations.push(
      `${rel(entryFile)} must route page reload scheduling through runPageRefreshAutomation(event)`
    );
  }
  if (/from\s+["']\.\.\/state\/store\.js["']/.test(text) || /\boption:\s*g\(/.test(text)) {
    violations.push(`${rel(entryFile)} must not compose page refresh option fields`);
  }
  if (!/globalThis\.sessionStorage\?\.setItem\(PAGE_AUTOMATION_FAILURE_KEY/.test(text)) {
    violations.push(`${rel(entryFile)} must persist page automation failure evidence`);
  }
  if (!/catch\s*\(error\)\s*{[\s\S]*recordPageAutomationFailure\(stage,\s*"stepException"/.test(text)) {
    violations.push(`${rel(entryFile)} must classify page-ready step exceptions`);
  }
  const entryTestFile = path.join(root, "src/pages/page-automation.test.js");
  const entryTestText = fs.existsSync(entryTestFile) ? fs.readFileSync(entryTestFile, "utf8") : "";
  if (!entryTestText.includes("rejects unknown page automation events without routing pages")) {
    violations.push(`${rel(entryTestFile)} must cover unknown page automation events`);
  }
  if (!entryTestText.includes("runPageAutomation(null)")) {
    violations.push(`${rel(entryTestFile)} must cover null page automation events`);
  }
  for (const required of [
    "PAGE_AUTOMATION_FAILURE_KEY",
    "HVAA:lastPageAutomationFailure",
    "records page routing step failures and stops later routing",
    "records game-page child automation failures at the page routing boundary",
    "keeps page routing failure evidence when diagnostic console is blocked",
    "stepException",
    "isekaiPageReady",
    "PageKind.ISEKAI_LOBBY",
  ]) {
    if (!entryTestText.includes(required)) {
      violations.push(`${rel(entryTestFile)} must cover ${required}`);
    }
  }
  const failureTestText = fs.existsSync(failureTestFile)
    ? fs.readFileSync(failureTestFile, "utf8")
    : "";
  for (const required of [
    "does not continue page routing when failure evidence and warning both fail",
    "PAGE_AUTOMATION_FAILURE_KEY",
    'throw new Error("quota")',
    'throw new Error("console blocked")',
    "expect(mocks.runBattleAutomation).not.toHaveBeenCalled()",
  ]) {
    if (!failureTestText.includes(required)) {
      violations.push(`${rel(failureTestFile)} must cover ${required}`);
    }
  }
  const diagnosticKeysText = fs.readFileSync(diagnosticKeysFile, "utf8");
  for (const required of [
    "PAGE_AUTOMATION_FAILURE: \"HVAA:lastPageAutomationFailure\"",
    'source("pageAutomationFailure", DiagnosticEvidenceKey.PAGE_AUTOMATION_FAILURE)',
  ]) {
    if (!diagnosticKeysText.includes(required)) {
      violations.push(`${rel(diagnosticKeysFile)} must expose ${required}`);
    }
  }
  const diagnosticTestText = fs.readFileSync(diagnosticTestFile, "utf8");
  for (const required of [
    "HVAA:lastPageAutomationFailure",
    "pageAutomationFailure",
    "pageAutomation",
  ]) {
    if (!diagnosticTestText.includes(required)) {
      violations.push(`${rel(diagnosticTestFile)} must cover ${required}`);
    }
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
