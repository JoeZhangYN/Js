import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const entryFile = path.join(root, "src/pages/equipment-view-automation.js");
const deletedLiveFile = path.join(root, "src/pages/equip-percentile-live.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkInit() {
  const lines = fs.readFileSync(initFile, "utf8").split(/\r?\n/);
  const forbidden = [
    /\bsetupForgeCost\b/,
    /\bsetupEquipPercentile\b/,
    /\bforgeCostShow\b/,
    /\bequipPercentileMode\b/,
    /\bisOptionOn\b/,
    /\bgetOption\b/,
    /#eu span/,
  ];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runEquipmentViewAutomation")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} equipment view workflow belongs in runEquipmentViewAutomation(kind)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(entryFile, "utf8");
  if (!/export function runEquipmentViewAutomation\(\s*kind\s*\)/.test(text)) {
    violations.push(`${rel(entryFile)} must expose runEquipmentViewAutomation(kind)`);
  }
  for (const required of ["setupForgeCost", "setupEquipPercentile", "PageKind.SHOWEQUIP"]) {
    if (!text.includes(required)) {
      violations.push(`${rel(entryFile)} must own ${required} equipment workflow wiring`);
    }
  }
}

function checkDeletedLivePath() {
  if (fs.existsSync(deletedLiveFile)) {
    violations.push(
      `${rel(deletedLiveFile)} deprecated live percentile implementation must stay deleted`
    );
  }
  const files = [
    path.join(root, "src/pages/equip-percentile-dispatcher.js"),
    path.join(root, "src/pages/equipment-view-automation.js"),
  ];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (/\bsetupEquipPercentileLive\b|equip-percentile-live\.js/.test(text)) {
      violations.push(`${rel(file)} must not reference deleted live percentile path`);
    }
  }
  const viteConfig = fs.readFileSync(path.join(root, "vite.config.js"), "utf8");
  if (/\b(?:hvitems\.niblseed\.com|reasoningtheory\.net)\b/.test(viteConfig)) {
    violations.push("vite.config.js must not keep deprecated live percentile @connect hosts");
  }
}

checkInit();
checkEntry();
checkDeletedLivePath();

if (violations.length) {
  console.error("[verify-equipment-view-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-equipment-view-boundary] OK — equipment view workflow is behind one entry");
