import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const riddleFile = path.join(root, "src/pages/riddle-automation.js");
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

function checkRiddleEntry() {
  const text = fs.readFileSync(riddleFile, "utf8");
  if (!/export function runRiddleAutomation\(/.test(text)) {
    violations.push(`${rel(riddleFile)} must expose runRiddleAutomation()`);
  }
}

checkInit();
checkRiddleEntry();

if (violations.length) {
  console.error("[verify-riddle-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-riddle-boundary] OK — riddle workflow is behind one entry");
