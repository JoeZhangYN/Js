import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const entryFile = path.join(root, "src/pages/cross-site-encounter-navigation.js");
const failureFile = path.join(root, "src/pages/cross-site-encounter-failure.js");
const entryTestFile = path.join(root, "src/pages/cross-site-encounter-navigation.test.js");
const failureTestFile = path.join(root, "src/pages/cross-site-encounter-failure.test.js");
const srcDir = path.join(root, "src");
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
        `${rel(initFile)}:${index + 1} cross-site encounter navigation belongs in runCrossSiteEncounterNavigation(event)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(entryFile, "utf8");
  const failureText = fs.readFileSync(failureFile, "utf8");
  if (!/export const CrossSiteEncounterEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(entryFile)} must expose CrossSiteEncounterEvent`);
  }
  if (!/export function runCrossSiteEncounterNavigation\(\s*event\b/.test(text)) {
    violations.push(`${rel(entryFile)} must expose runCrossSiteEncounterNavigation(event)`);
  }
  if (/export function runCrossSiteEncounterNavigation\(\s*kind\s*\)/.test(text)) {
    violations.push(`${rel(entryFile)} must not expose raw kind-based navigation entry`);
  }
  if (text.includes("event.type !== EVENT_PAGE_READY")) {
    violations.push(`${rel(entryFile)} must reject null cross-site navigation events without throwing`);
  }
  if (!text.includes("event?.type !== EVENT_PAGE_READY")) {
    violations.push(`${rel(entryFile)} must fail closed for unknown or null cross-site navigation events`);
  }
  if (/\b(?:getValue|setValue)\(\s*["']url["']/.test(text)) {
    violations.push(`${rel(entryFile)} must use STORAGE_KEYS.URL for return-origin storage`);
  }
  for (const required of [
    "CrossSiteEncounterEvent",
    "EVENT_PAGE_READY",
    "PageKind.EHENTAI",
    "news.php?encounter",
    "STORAGE_KEYS.URL",
    "persistCrossSiteReturnOrigin",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(entryFile)} must own ${required} cross-site navigation wiring`);
    }
  }
  for (const required of [
    "CROSS_SITE_ENCOUNTER_FAILURE_KEY",
    "HVAA:lastCrossSiteEncounterFailure",
    "persistCrossSiteReturnOrigin",
    "recordCrossSiteEncounterFailure",
    "storageWrite",
    "crossSiteEncounter",
  ]) {
    if (!failureText.includes(required)) {
      violations.push(`${rel(failureFile)} must own ${required}`);
    }
  }
  const testText = fs.readFileSync(entryTestFile, "utf8");
  if (
    !testText.includes("rejects unknown and null events without storing or navigating") ||
    !testText.includes("runCrossSiteEncounterNavigation(null")
  ) {
    violations.push(`${rel(entryTestFile)} must cover unknown and null cross-site navigation events`);
  }
  const failureTestText = fs.readFileSync(failureTestFile, "utf8");
  for (const required of [
    "records return-origin persistence failures without blocking game-page flow",
    "does not throw when return-origin failure evidence and warning both fail",
    "CROSS_SITE_ENCOUNTER_FAILURE_KEY",
    "return origin write blocked",
    "storageWrite",
  ]) {
    if (!failureTestText.includes(required)) {
      violations.push(`${rel(failureTestFile)} must cover ${required}`);
    }
  }
}

function checkPageAutomation() {
  const text = fs.readFileSync(path.join(root, "src/pages/page-automation.js"), "utf8");
  if (!text.includes("CrossSiteEncounterEvent.PAGE_READY")) {
    violations.push("src/pages/page-automation.js must report CrossSiteEncounterEvent.PAGE_READY");
  }
  if (/runCrossSiteEncounterNavigation\(\s*kind\s*\)/.test(text)) {
    violations.push("src/pages/page-automation.js must not call cross-site navigation with raw kind");
  }
}

function walk(dir, visitor) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visitor);
    else if (entry.isFile() && entry.name.endsWith(".js")) visitor(full);
  }
}

function checkReturnOriginStorageOwner() {
  const allowed = new Set(
    [entryFile, failureFile, entryTestFile, failureTestFile].map((file) => path.normalize(file))
  );
  walk(srcDir, (file) => {
    if (allowed.has(path.normalize(file))) return;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\bSTORAGE_KEYS\.URL\b/.test(line)) {
        violations.push(
          `${rel(file)}:${index + 1} return-origin storage belongs in runCrossSiteEncounterNavigation(event)`
        );
      }
    });
  });
}

checkInit();
checkEntry();
checkPageAutomation();
checkReturnOriginStorageOwner();

if (violations.length) {
  console.error("[verify-cross-site-encounter-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-cross-site-encounter-boundary] OK — cross-site encounter navigation is behind one entry"
);
