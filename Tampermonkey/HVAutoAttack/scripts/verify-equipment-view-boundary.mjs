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
    /\bsetupEquipPercentile(?:Offline|Live)?\b/,
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
        `${rel(initFile)}:${index + 1} equipment view workflow belongs in runEquipmentViewAutomation(event)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(entryFile, "utf8");
  if (!/export const EquipmentViewEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(entryFile)} must expose EquipmentViewEvent`);
  }
  if (!/export function runEquipmentViewAutomation\(\s*event\b/.test(text)) {
    violations.push(`${rel(entryFile)} must expose runEquipmentViewAutomation(event)`);
  }
  if (/export function runEquipmentViewAutomation\(\s*kind\s*\)/.test(text)) {
    violations.push(`${rel(entryFile)} must not expose raw kind-based equipment entry`);
  }
  for (const required of [
    "EquipmentViewEvent",
    "EVENT_PAGE_READY",
    "runForgeCostEnhancement",
    "runEquipPercentileEnhancement",
    "PageKind.SHOWEQUIP",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(entryFile)} must own ${required} equipment workflow wiring`);
    }
  }
}

function checkPageAutomation() {
  const text = fs.readFileSync(path.join(root, "src/pages/page-automation.js"), "utf8");
  if (!text.includes("EquipmentViewEvent.PAGE_READY")) {
    violations.push("src/pages/page-automation.js must report EquipmentViewEvent.PAGE_READY");
  }
  if (/runEquipmentViewAutomation\(\s*kind\s*\)/.test(text)) {
    violations.push(
      "src/pages/page-automation.js must not call equipment view automation with raw kind"
    );
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

function checkDeletedSetupEntrypoints() {
  const files = [
    path.join(root, "src/pages/equipment-view-automation.js"),
    path.join(root, "src/pages/showequip-forge-cost.js"),
    path.join(root, "src/pages/equip-percentile-dispatcher.js"),
    path.join(root, "src/pages/equip-percentile-offline.js"),
  ];
  const oldSetupEntrypoint = /\bsetup(?:ForgeCost|EquipPercentile(?:Offline|Live)?)\b/;
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (oldSetupEntrypoint.test(text)) {
      violations.push(`${rel(file)} must use equipment percentile business entrypoints`);
    }
  }
}

function checkPercentileModeDecisionPoint() {
  const entryText = fs.readFileSync(entryFile, "utf8");
  const dispatcherFile = path.join(root, "src/pages/equip-percentile-dispatcher.js");
  const dispatcherText = fs.readFileSync(dispatcherFile, "utf8");

  if (!/runEquipPercentileEnhancement\(\s*equipPercentileMode\s*\)/.test(entryText)) {
    violations.push(
      `${rel(entryFile)} must pass the decided equip percentile mode to the executor`
    );
  }
  if (
    /OptionEvent|runOptionAutomation|READ_FIELD|equipPercentileMode",\s*"off"/.test(dispatcherText)
  ) {
    violations.push(`${rel(dispatcherFile)} must not re-read equip percentile option state`);
  }
}

checkInit();
checkEntry();
checkPageAutomation();
checkDeletedLivePath();
checkDeletedSetupEntrypoints();
checkPercentileModeDecisionPoint();

if (violations.length) {
  console.error("[verify-equipment-view-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-equipment-view-boundary] OK — equipment view workflow is behind one entry");
