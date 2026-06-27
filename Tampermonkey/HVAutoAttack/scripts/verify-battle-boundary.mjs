import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const battleFile = path.join(root, "src/battle/battle-automation.js");
const reloaderFile = path.join(root, "src/battle/reloader.js");
const mainLoopFile = path.join(root, "src/battle/main-loop.js");
const roundStartFile = path.join(root, "src/battle/new-round.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkInit() {
  const text = fs.readFileSync(initFile, "utf8");
  const lines = text.split(/\r?\n/);
  const forbidden = [
    /\bmain\b/,
    /\bpauseChange\b/,
    /\breloader\b/,
    /\bnewRound\b/,
    /\bsyncMonsterDb\b/,
    /\bsetupScanWatch\b/,
    /\brenderResistPanel\b/,
    /\bbattleCode\b/,
    /\bpauseButton\b/,
    /\bpauseHotkey\b/,
    /\bhvAABox2\b/,
    /\bbattle_main\b/,
  ];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runBattleAutomation")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} battle workflow belongs in runBattleAutomation()`
      );
    }
  });
}

function checkBattleEntry() {
  const text = fs.readFileSync(battleFile, "utf8");
  if (!/export function runBattleAutomation\(/.test(text)) {
    violations.push(`${rel(battleFile)} must expose runBattleAutomation()`);
  }
  if (!text.includes("runBattleRoundStartAutomation")) {
    violations.push(`${rel(battleFile)} must start rounds through runBattleRoundStartAutomation()`);
  }
  if (!text.includes("runBattleTurnAutomation")) {
    violations.push(`${rel(battleFile)} must run turns through runBattleTurnAutomation()`);
  }
  if (!text.includes("installBattleActionEventBridge")) {
    violations.push(`${rel(battleFile)} must install action events through installBattleActionEventBridge()`);
  }
}

function checkRoundStartCallers() {
  for (const file of [battleFile, reloaderFile]) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.includes("runBattleRoundStartAutomation")) return;
      if (/\bnewRound\s*\(/.test(line)) {
        violations.push(
          `${rel(file)}:${index + 1} legacy newRound() call is forbidden; use runBattleRoundStartAutomation(event)`
        );
      }
    });
  }
}

function checkRoundStartEntry() {
  const text = fs.readFileSync(roundStartFile, "utf8");
  if (!/export function runBattleRoundStartAutomation\(/.test(text)) {
    violations.push(`${rel(roundStartFile)} must expose runBattleRoundStartAutomation(event)`);
  }
  if (/\b(?:export\s+)?function\s+newRound\s*\(/.test(text)) {
    violations.push(
      `${rel(roundStartFile)} legacy newRound() bridge must stay deleted; use runBattleRoundStartAutomation(event)`
    );
  }
}

function checkTurnEntry() {
  const text = fs.readFileSync(mainLoopFile, "utf8");
  if (!/export function runBattleTurnAutomation\(/.test(text)) {
    violations.push(`${rel(mainLoopFile)} must expose runBattleTurnAutomation()`);
  }
  if (/\b(?:export\s+)?function\s+main\s*\(/.test(text)) {
    violations.push(`${rel(mainLoopFile)} legacy main() bridge must stay deleted; use runBattleTurnAutomation()`);
  }
  for (const file of [battleFile, reloaderFile]) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.includes("runBattleTurnAutomation")) return;
      if (/\bmain\s*\(/.test(line)) {
        violations.push(
          `${rel(file)}:${index + 1} legacy main() call is forbidden; use runBattleTurnAutomation()`
        );
      }
    });
  }
}

function checkActionEventBridgeEntry() {
  const text = fs.readFileSync(reloaderFile, "utf8");
  if (!/export function installBattleActionEventBridge\(/.test(text)) {
    violations.push(`${rel(reloaderFile)} must expose installBattleActionEventBridge()`);
  }
  if (/\b(?:export\s+)?function\s+reloader\s*\(/.test(text)) {
    violations.push(`${rel(reloaderFile)} legacy reloader() bridge must stay deleted; use installBattleActionEventBridge()`);
  }
  const battleText = fs.readFileSync(battleFile, "utf8");
  if (/\breloader\s*\(/.test(battleText)) {
    violations.push(`${rel(battleFile)} legacy reloader() call is forbidden; use installBattleActionEventBridge()`);
  }
}

checkInit();
checkBattleEntry();
checkRoundStartCallers();
checkRoundStartEntry();
checkTurnEntry();
checkActionEventBridgeEntry();

if (violations.length) {
  console.error("[verify-battle-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-boundary] OK — battle workflow is behind one entry");
