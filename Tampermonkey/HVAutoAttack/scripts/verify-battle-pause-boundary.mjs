import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const entry = path.normalize("src/battle/pause-automation.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.isFile() && item.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  if (relative.endsWith(".test.js")) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    const where = `${rel(file)}:${index + 1}`;
    if (/\bpauseChange\s*\(/.test(line) || /\bimport\b.*\bpauseChange\b/.test(line)) {
      violations.push(`${where} legacy pauseChange path is forbidden`);
    }
    if (relative !== entry && /\bpauseScript\b/.test(line)) {
      violations.push(
        `${where} legacy pauseScript bridge is forbidden; use runBattlePauseAutomation(event)`
      );
    }
    if (/\b(?:setValue|getValue|delValue)\(\s*["']disabled["']/.test(line)) {
      violations.push(`${where} disabled state belongs in runBattlePauseAutomation(event)`);
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runBattlePauseAutomation\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose runBattlePauseAutomation(event)`);
  }
  if (!text.includes("STORAGE_KEYS.DISABLED")) {
    violations.push(`${entry.replaceAll("\\", "/")} must use STORAGE_KEYS.DISABLED`);
  }
  for (const required of ["battlePauseEventHandlers", "STORAGE_KEYS.DISABLED", "delValue(0)"]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} pause wiring`);
    }
  }
  for (const required of [
    "BattlePauseEvidenceEvent.RECORD_STATE",
    "runBattlePauseEvidence",
    "recordPauseState",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must record pause evidence ${required}`);
    }
  }
  const evidence = path.normalize("src/battle/battle-pause-evidence.js");
  const evidenceText = fs.readFileSync(path.join(root, evidence), "utf8");
  for (const required of [
    "BattlePauseEvidenceEvent",
    "runBattlePauseEvidence",
    "DiagnosticEvidenceKey.BATTLE_PAUSE",
    "[HVAA] battle pause",
  ]) {
    if (!evidenceText.includes(required)) {
      violations.push(`${evidence.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  const entryBody =
    text.match(/export function runBattlePauseAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_RENDER_PAUSED\][\s\S]*\[EVENT_PAUSE\]/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${entry.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
}

function checkBridgeRemoved() {
  const bridge = path.join(root, "src/battle/pause-control.js");
  if (fs.existsSync(bridge)) {
    violations.push("src/battle/pause-control.js legacy pause bridge must stay deleted");
  }
}

walk(srcDir);
checkEntry();
checkBridgeRemoved();

if (violations.length) {
  console.error("[verify-battle-pause-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-pause-boundary] OK — battle pause workflow is behind one entry");
