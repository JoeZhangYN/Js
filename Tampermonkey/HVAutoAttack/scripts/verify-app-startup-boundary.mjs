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
    "loadCdState",
    "registerExportMenu",
    "runAbilityAoeAutomation",
    "GM_info",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(entryFile)} must own ${required} startup wiring`);
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
