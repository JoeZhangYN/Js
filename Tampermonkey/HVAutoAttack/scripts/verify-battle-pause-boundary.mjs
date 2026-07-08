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
    "storageWriteOk",
    "storageWriteError",
  ]) {
    if (!evidenceText.includes(required)) {
      violations.push(`${evidence.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  if (!evidenceText.includes("battlePauseEvidenceEventHandlers[event?.type]")) {
    violations.push(`${evidence.replaceAll("\\", "/")} must reject null pause evidence events`);
  }
  const evidenceTest = path.normalize("src/battle/battle-pause-evidence.test.js");
  const evidenceTestText = fs.readFileSync(path.join(root, evidenceTest), "utf8");
  if (!evidenceTestText.includes("runBattlePauseEvidence(null)")) {
    violations.push(`${evidenceTest.replaceAll("\\", "/")} must cover null pause evidence events`);
  }
  for (const required of [
    "keeps pause evidence stored when debug output fails",
    'throw new Error("console blocked")',
    "not.toThrow()",
  ]) {
    if (!evidenceTestText.includes(required)) {
      violations.push(`${evidenceTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  const persistenceTest = path.normalize("src/battle/battle-action-evidence-persistence.test.js");
  const persistenceTestText = fs.readFileSync(path.join(root, persistenceTest), "utf8");
  for (const required of [
    "keeps pause evidence visible when storage is unavailable",
    'storageWriteError: "quota"',
  ]) {
    if (!persistenceTestText.includes(required)) {
      violations.push(`${persistenceTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  const entryBody =
    text.match(/export function runBattlePauseAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_RENDER_PAUSED\][\s\S]*\[EVENT_PAUSE\]/.test(text)) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must route events through a frozen handler table`
    );
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${entry.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
  for (const required of [
    "unknownPauseEvent",
    "pausePersistenceFailed",
    "battlePauseEventHandlers[event?.type]",
    'recordPauseState("rejected", EVENT_UNKNOWN_PAUSE, { eventType: event?.type ?? null })',
  ]) {
    if (!text.includes(required)) {
      violations.push(
        `${entry.replaceAll("\\", "/")} must reject unknown pause events with evidence ${required}`
      );
    }
  }
  const entryTest = path.normalize("src/battle/pause-automation.test.js");
  const entryTestText = fs.readFileSync(path.join(root, entryTest), "utf8");
  for (const required of [
    "rejects unknown events without touching pause state",
    "rejects null events with pause evidence instead of throwing",
    "does not report pause success when disabled persistence fails",
    "does not report toggle pause success when disabled persistence fails",
    "disabled write blocked",
    "pausePersistenceFailed",
    "unknownPauseEvent",
    "eventType: null",
  ]) {
    if (!entryTestText.includes(required)) {
      violations.push(
        `${entryTest.replaceAll("\\", "/")} must cover pause event rejection ${required}`
      );
    }
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
