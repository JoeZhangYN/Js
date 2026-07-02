import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const entryFile = path.join(root, "src/pages/app-startup.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkInit() {
  const lines = fs.readFileSync(initFile, "utf8").split(/\r?\n/);
  const forbidden = [
    /\bloadCdState\b/,
    /\bregisterExportMenu\b/,
    /\brunPageRefreshAutomation\b/,
    /\baddStyle\b/,
    /\b_alert\b/,
    /\bGM_info\b/,
    /\bunsafeWindow\b/,
    /\bwindow\.prompt\b/,
    /\b(?:getValue|setValue)\(\s*["']option["']/,
    /\b(?:getValue|setValue)\(\s*["']spellAoe["']/,
    /\bg\(\s*["'](?:option|lang|version)["']/,
    /\[class\^=["']c[45]["']\]/,
  ];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runAppStartup") || line.includes("AppStartupEvent")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} app startup state belongs in runAppStartup(event)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(entryFile, "utf8");
  if (!/export function runAppStartup\(/.test(text)) {
    violations.push(`${rel(entryFile)} must expose runAppStartup(event)`);
  }
  for (const required of [
    "appStartupEventHandlers",
    "APP_STARTUP_FAILURE_KEY",
    "USERSCRIPT_STARTUP_STEPS",
    "GAME_PAGE_STARTUP_STEPS",
    "recordAppStartupFailure",
    "runStartupStep",
    "runUserscriptStartup",
    "runGamePageStartup",
    "loadCdRuntimeState",
    "registerRiddleDatasetExportMenu",
    "syncConfiguredStartupOption",
    "runCdRuntimeAutomation",
    "CdRuntimeEvent.LOAD",
    "runRiddleDatasetAutomation",
    "RiddleDatasetEvent.REGISTER_EXPORT_MENU",
    "runAbilityAoeAutomation",
    "OptionEvent.SYNC_STARTUP_OPTION",
    "GM_info",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(entryFile)} must own ${required} startup wiring`);
    }
  }
  if (
    !/const USERSCRIPT_STARTUP_STEPS = \[\s*\["loadCdRuntimeState",\s*loadCdRuntimeState\],[\s\S]*\["registerRiddleDatasetExportMenu",\s*registerRiddleDatasetExportMenu\],\s*\]/.test(
      text
    )
  ) {
    violations.push(`${rel(entryFile)} must own explicit userscript startup order`);
  }
  if (
    !/const GAME_PAGE_STARTUP_STEPS = \[\s*\["syncConfiguredStartupOption",\s*syncConfiguredStartupOption\],[\s\S]*\["warnDefaultFont",\s*warnDefaultFont\],[\s\S]*\["loadBattleLearningState",\s*loadBattleLearningState\],\s*\]/.test(
      text
    )
  ) {
    violations.push(`${rel(entryFile)} must own explicit game-page startup order`);
  }
  if (
    !/\[EVENT_USERSCRIPT_START\]: runUserscriptStartup[\s\S]*\[EVENT_GAME_PAGE_READY\]: runGamePageStartup/.test(
      text
    )
  ) {
    violations.push(`${rel(entryFile)} must route startup events through appStartupEventHandlers`);
  }
  const entryBody =
    text.match(/export function runAppStartup\(event = \{ type: EVENT_USERSCRIPT_START \}\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(entryFile)} entry must route events through handler table`);
  }
  if (entryBody.includes("appStartupEventHandlers[event.type]")) {
    violations.push(`${rel(entryFile)} entry must reject null startup events without throwing`);
  }
  if (!entryBody.includes("appStartupEventHandlers[event?.type]")) {
    violations.push(`${rel(entryFile)} entry must fail closed for unknown or null startup events`);
  }
  if (/\?\?\s*true/.test(entryBody)) {
    violations.push(`${rel(entryFile)} must reject unknown startup events instead of reporting success`);
  }
  for (const forbidden of [
    "runCdRuntimeAutomation",
    "runRiddleDatasetAutomation",
    "syncOptionVersion",
    "requestInitialConfig",
    "warnDefaultFont",
    "loadBattleLearningState",
  ]) {
    if (entryBody.includes(forbidden)) {
      violations.push(`${rel(entryFile)} entry must route startup through flow functions`);
    }
  }
  if (/\bg\(\s*["']option["']/.test(text)) {
    violations.push(`${rel(entryFile)} must not install raw option state directly`);
  }
  if (!/globalThis\.sessionStorage\?\.setItem\(APP_STARTUP_FAILURE_KEY/.test(text)) {
    violations.push(`${rel(entryFile)} must persist startup failure evidence`);
  }
  if (!/catch\s*\(error\)\s*{[\s\S]*recordAppStartupFailure\(stage,\s*"stepException"/.test(text)) {
    violations.push(`${rel(entryFile)} must classify startup step exceptions`);
  }
  if (!/recordAppStartupFailure\("requestInitialConfig",\s*"missingConfigButton"/.test(text)) {
    violations.push(`${rel(entryFile)} must classify missing initial config button failures`);
  }
  if (!/recordAppStartupFailure\("warnDefaultFont",\s*"warningFailed"/.test(text)) {
    violations.push(`${rel(entryFile)} must isolate default font warning failures`);
  }
  if (/\bOptionEvent\.READ\b|\bOptionEvent\.WRITE\b/.test(text)) {
    violations.push(`${rel(entryFile)} must sync startup option through named option command`);
  }
  const testText = fs.readFileSync(path.join(root, "src/pages/app-startup.test.js"), "utf8");
  if (
    !testText.includes("rejects unknown startup events as no-op") ||
    testText.includes("accepts unknown startup events as no-op")
  ) {
    violations.push(`${rel(entryFile)} tests must lock unknown startup events as rejected no-ops`);
  }
  if (!testText.includes("runAppStartup(null)")) {
    violations.push(`${rel(entryFile)} tests must cover null startup events`);
  }
  for (const required of [
    "APP_STARTUP_FAILURE_KEY",
    "does not report userscript startup success when a startup step throws",
    "records missing config button evidence when initial config cannot open settings",
    "isolates default-font warning failures and continues startup",
    "keeps startup failure evidence when diagnostic console is blocked",
    "stepException",
    "missingConfigButton",
    "warningFailed",
  ]) {
    if (!testText.includes(required)) {
      violations.push(`${rel(entryFile)} tests must cover ${required}`);
    }
  }
}

checkInit();
checkEntry();

if (violations.length) {
  console.error("[verify-app-startup-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-app-startup-boundary] OK — app startup state is behind one entry");
