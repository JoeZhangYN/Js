import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const entryFile = path.join(root, "src/pages/cross-site-encounter-navigation.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkInit() {
  const lines = fs.readFileSync(initFile, "utf8").split(/\r?\n/);
  const forbidden = [
    /\beventpane\b/,
    /news\.php\?encounter/,
    /\bdocument\.referrer\b/,
    /\bnew URL\(\s*document\.referrer\b/,
    /\bopenUrl\b/,
    /\b(?:getValue|setValue)\(\s*["']url["']/,
  ];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runCrossSiteEncounterNavigation")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} cross-site encounter navigation belongs in runCrossSiteEncounterNavigation(kind)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(entryFile, "utf8");
  if (!/export function runCrossSiteEncounterNavigation\(\s*kind\s*\)/.test(text)) {
    violations.push(`${rel(entryFile)} must expose runCrossSiteEncounterNavigation(kind)`);
  }
  for (const required of ["PageKind.EHENTAI", "news.php?encounter", "setValue(\"url\""]) {
    if (!text.includes(required)) {
      violations.push(`${rel(entryFile)} must own ${required} cross-site navigation wiring`);
    }
  }
}

checkInit();
checkEntry();

if (violations.length) {
  console.error("[verify-cross-site-encounter-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-cross-site-encounter-boundary] OK — cross-site encounter navigation is behind one entry");
