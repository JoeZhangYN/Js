import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-completion.js");
const rulingOwner = path.normalize("src/battle/battle-completion-ruling.js");
const ownerTest = path.normalize("src/battle/battle-completion.test.js");
const rejectionTest = path.normalize("src/battle/battle-completion-rejection.test.js");
const encounterTest = path.normalize("src/battle/battle-completion-encounter.test.js");
const monitorResultTest = path.normalize("src/battle/battle-completion-monitor-result.test.js");
const evidence = path.normalize("src/battle/battle-completion-evidence.js");
const evidenceTest = path.normalize("src/battle/battle-completion-evidence.test.js");
const actionEventBridge = path.normalize("src/battle/battle-action-event-bridge.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkActionEventBridge() {
  const file = path.join(root, actionEventBridge);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (/\bg\(\s*["'](?:monsterAlive|roundNow|roundAll)["']\s*\)/.test(line)) {
      violations.push(`${where} battle completion decision belongs in battle-completion`);
    }
    if (/setAlarm\(\s*["'](?:Defeat|Victory)["']/.test(line)) {
      violations.push(`${where} terminal completion alarm belongs in battle-completion`);
    }
    if (/CLEAR_SESSION|scheduleReload\(\s*3\s*\)/.test(line)) {
      violations.push(`${where} terminal completion side effects belong in battle-completion`);
    }
  });
}

function checkOwner() {
  const text = fs.readFileSync(path.join(root, owner), "utf8");
  const rulingText = fs.readFileSync(path.join(root, rulingOwner), "utf8");
  for (const required of [
    "runBattleCompletionAutomation",
    "battleCompletionEventHandlers",
    "COMPLETION_REACHED",
    "READ_REACHED",
    'gE("#btcp")',
    "Defeat",
    "Victory",
    "VICTORY_RELOAD_SECONDS",
    "victoryReloadDetail",
    'source: "battleCompletion"',
    "context",
    "CLEAR_SESSION",
    "scheduleReload",
    "readCompletionContext",
    "deps.readCompletionContext",
    "deps.recordCompletion",
    "recordCompletionResult",
    "deps.isCompletionReached",
    "handleTerminalCompletion",
    "BattleCompletionEvidenceEvent.RECORD_COMPLETION",
    "runBattleCompletionEvidence",
    "recordCompletionEvidence",
    "unknownCompletionEvent",
    "BattleMonitorEvent.COMPLETION_REACHED",
    "runBattleMonitorAutomation",
    "BattleProgressEvent.READ_CONTEXT",
    "EncounterEvent.BATTLE_SESSION_TERMINAL",
    "deps.markSessionTerminal(outcome)",
    "deps.completeEncounter(terminalSession.snapshot)",
    "normalizeEncounterCompletion",
    "encounterCompletionOk",
    "counted",
    "roundType: progress.roundType",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  for (const required of ["BattleCompletionOutcome", "NEXT_ROUND", "classifyBattleCompletion"]) {
    if (!rulingText.includes(required)) {
      violations.push(`${rulingOwner.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  const classifyMatch = rulingText.match(
    /function\s+classifyBattleCompletion\s*\([^)]*\)\s*\{(?<body>[\s\S]*?)\n\}/
  );
  if (!classifyMatch) {
    violations.push(`${rulingOwner.replaceAll("\\", "/")} must own classifyBattleCompletion`);
  } else if (/\bg\s*\(/.test(classifyMatch.groups.body)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must classify from one completion context, not repeated g() reads`
    );
  }
  if (/\bdeps\.g\(\s*["'](?:monsterAlive|roundNow|roundAll)["']/.test(text)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must read completion fields through readCompletionContext`
    );
  }
  if ((text.match(/#btcp/g) || []).length !== 1) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must own the completion panel reachability read`
    );
  }
  if (/\bg\(\s*["'](?:monsterAlive|roundNow|roundAll)["']\s*\)/.test(text)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must compose completion context through battle-progress`
    );
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleCompletionEvent\b|runBattleCompletionAutomation\b)/.test(
      text
    )
  ) {
    violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
  }
  if (
    /BattleRoundEvent\.(?:READ_RUNTIME|READ_TYPE)|MonsterStatusEvent\.READ_COMBATANT_COUNTS/.test(
      text
    )
  ) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must not reassemble battle progress facts directly`
    );
  }
  const recordIndex = text.indexOf("deps.recordCompletion()");
  const readIndex = text.indexOf("deps.readCompletionContext()");
  if (recordIndex === -1 || readIndex === -1 || recordIndex > readIndex) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must record completion before reading completion ruling context`
    );
  }
  if (!fs.existsSync(path.join(root, ownerTest))) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover battle completion contract`);
  }
  if (/scheduleReload\(\s*3\s*\)/.test(text)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must route victory reload through VICTORY_RELOAD_SECONDS`
    );
  }
  if ((text.match(/deps\.clearSession\(\)/g) || []).length !== 1) {
    violations.push(
      `${owner.replaceAll("\\", "/")} terminal completion cleanup must have one side-effect point`
    );
  }
  const terminalIndex = text.indexOf("deps.markSessionTerminal(outcome)");
  const encounterIndex = text.indexOf("deps.completeEncounter(terminalSession.snapshot)");
  const clearIndex = text.indexOf("deps.clearSession()");
  if (
    terminalIndex < 0 ||
    encounterIndex < 0 ||
    clearIndex < 0 ||
    terminalIndex > encounterIndex ||
    encounterIndex > clearIndex
  ) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must persist terminal session, settle encounter, then clear session`
    );
  }
  const entryBody =
    text.match(/export function runBattleCompletionAutomation\([^)]*\)[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_COMPLETION_REACHED\]/.test(text)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must route events through a frozen handler table`
    );
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
  if (!text.includes("battleCompletionEventHandlers[event?.type]")) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must reject null events through the completion entry`
    );
  }
  if (fs.existsSync(path.join(root, ownerTest))) {
    const testText = [ownerTest, rejectionTest]
      .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
      .join("\n");
    if (!testText.includes("rejects unknown battle completion events without side effects")) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown completion events`);
    }
    if (!testText.includes("unknownCompletionEvent")) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown completion evidence`);
    }
    if (!testText.includes("rejects null battle completion events without side effects")) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null completion events`);
    }
    if (!testText.includes("reads completion panel reachability through the completion entry")) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover completion reachability`);
    }
    if (!testText.includes('source: "battleCompletion"')) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover victory reload detail`);
    }
  }
  const encounterTestText = fs.existsSync(path.join(root, encounterTest))
    ? fs.readFileSync(path.join(root, encounterTest), "utf8")
    : "";
  if (
    !encounterTestText.includes(
      "records a random encounter terminal result before clearing its battle identity"
    )
  ) {
    violations.push(
      `${encounterTest.replaceAll("\\", "/")} must cover encounter completion before session clear`
    );
  }
  for (const required of [
    "keeps terminal cleanup running while evidencing encounter persistence failure",
    "does not turn an unknown encounter completion response into success evidence",
    'status: "persistenceFailed"',
    'status: "unknown"',
  ]) {
    if (!encounterTestText.includes(required)) {
      violations.push(`${encounterTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  if (!fs.existsSync(path.join(root, monitorResultTest))) {
    violations.push(
      `${monitorResultTest.replaceAll("\\", "/")} must cover failed monitor completion evidence`
    );
  } else {
    const monitorResultTestText = fs.readFileSync(path.join(root, monitorResultTest), "utf8");
    if (
      !monitorResultTestText.includes(
        "records failed completion monitor results as failed evidence"
      )
    ) {
      violations.push(
        `${monitorResultTest.replaceAll("\\", "/")} must cover failed monitor completion evidence`
      );
    }
  }
  if (!fs.existsSync(path.join(root, evidence))) {
    violations.push(`${evidence.replaceAll("\\", "/")} must record battle completion evidence`);
  } else {
    const evidenceText = fs.readFileSync(path.join(root, evidence), "utf8");
    for (const required of [
      "BattleCompletionEvidenceEvent",
      "runBattleCompletionEvidence",
      "DiagnosticEvidenceKey.BATTLE_COMPLETION",
      "storageWriteOk",
      "storageWriteError",
    ]) {
      if (!evidenceText.includes(required)) {
        violations.push(`${evidence.replaceAll("\\", "/")} must own ${required}`);
      }
    }
  }
  if (!fs.existsSync(path.join(root, evidenceTest))) {
    violations.push(`${evidenceTest.replaceAll("\\", "/")} must cover completion evidence`);
  } else {
    const evidenceTestText = fs.readFileSync(path.join(root, evidenceTest), "utf8");
    for (const required of [
      "records completion outcome evidence for diagnostics",
      "keeps completion evidence visible when storage is unavailable",
      "keeps completion evidence stored when debug output fails",
      "console blocked",
      "HVAA:lastBattleCompletion",
    ]) {
      if (!evidenceTestText.includes(required)) {
        violations.push(`${evidenceTest.replaceAll("\\", "/")} must cover ${required}`);
      }
    }
  }
}

checkActionEventBridge();
checkOwner();

if (violations.length) {
  console.error("[verify-battle-completion-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-completion-boundary] OK — battle completion decision is behind one entry"
);
