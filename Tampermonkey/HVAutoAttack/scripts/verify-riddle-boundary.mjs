import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const riddleFile = path.join(root, "src/pages/riddle-automation.js");
const battleDir = path.join(root, "src/battle");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkInit() {
  const lines = fs.readFileSync(initFile, "utf8").split(/\r?\n/);
  const forbidden = [
    /\briddleAlert\b/,
    /\briddlePopup\b/,
    /\briddleWindow\b/,
    /\bwindow\.open\b/,
    /\bwindow\.opener\b/,
  ];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runRiddleAutomation")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} riddle workflow belongs in runRiddleAutomation()`
      );
    }
  });
}

function checkBattleLayer() {
  const forbidden = [
    /\briddlePopup\b/,
    /\briddleWindow\b/,
    /\bwindow\.open\b/,
    /\bwindow\.opener\b/,
  ];
  for (const entry of fs.readdirSync(battleDir, { withFileTypes: true })) {
    const file = path.join(battleDir, entry.name);
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) return;
      if (line.includes("runRiddleAutomation") || line.includes("RiddleEvent")) return;
      if (forbidden.some((re) => re.test(line))) {
        violations.push(
          `${rel(file)}:${index + 1} battle riddle interruption belongs in runRiddleAutomation(event)`
        );
      }
    });
  }
}

function checkRiddleEntry() {
  const text = fs.readFileSync(riddleFile, "utf8");
  if (!/export function runRiddleAutomation\(/.test(text)) {
    violations.push(`${rel(riddleFile)} must expose runRiddleAutomation()`);
  }
  if (!text.includes("runRiddleAnsweringSession")) {
    violations.push(`${rel(riddleFile)} must route riddle answering through the business entry`);
  }
}

function checkDeletedSetupEntrypoints() {
  const files = [
    path.join(root, "src/pages/riddle-automation.js"),
    path.join(root, "src/pages/riddle.js"),
    path.join(root, "src/pages/riddle-helper.js"),
    path.join(root, "src/pages/riddle-ml.js"),
  ];
  const forbidden = /\b(?:riddleAlert|setupRiddleHelper|setupRMAHealth)\b/;
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (forbidden.test(text)) {
      violations.push(`${rel(file)} must use riddle business entrypoint names`);
    }
  }
}

checkInit();
checkBattleLayer();
checkRiddleEntry();
checkDeletedSetupEntrypoints();

if (violations.length) {
  console.error("[verify-riddle-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-riddle-boundary] OK — riddle workflow is behind one entry");
