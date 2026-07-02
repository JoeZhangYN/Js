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
    "USERSCRIPT_STARTUP_STEPS",
    "GAME_PAGE_STARTUP_STEPS",
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
    !/const USERSCRIPT_STARTUP_STEPS = \[\s*loadCdRuntimeState,\s*registerRiddleDatasetExportMenu\s*\]/.test(
      text
    )
  ) {
    violations.push(`${rel(entryFile)} must own explicit userscript startup order`);
  }
  if (
    !/const GAME_PAGE_STARTUP_STEPS = \[\s*syncConfiguredStartupOption,\s*warnDefaultFont,\s*loadBattleLearningState\s*\]/.test(
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
}

checkInit();
checkEntry();

if (violations.length) {
  console.error("[verify-app-startup-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-app-startup-boundary] OK — app startup state is behind one entry");
