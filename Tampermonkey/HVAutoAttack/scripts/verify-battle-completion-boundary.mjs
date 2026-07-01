import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-completion.js");
const ownerTest = path.normalize("src/battle/battle-completion.test.js");
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
  for (const required of [
    "runBattleCompletionAutomation",
    "battleCompletionEventHandlers",
    "COMPLETION_REACHED",
    "READ_REACHED",
    'gE("#btcp")',
    "NEXT_ROUND",
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
    "deps.isCompletionReached",
    "handleTerminalCompletion",
    "BattleMonitorEvent.COMPLETION_REACHED",
    "runBattleMonitorAutomation",
    "BattleProgressEvent.READ_CONTEXT",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  const classifyMatch = text.match(
    /function\s+classifyCompletion\s*\([^)]*\)\s*\{(?<body>[\s\S]*?)\n\}/
  );
  if (!classifyMatch) {
    violations.push(`${owner.replaceAll("\\", "/")} must own classifyCompletion`);
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
    violations.push(`${owner.replaceAll("\\", "/")} must own the completion panel reachability read`);
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
  const entryBody =
    text.match(/export function runBattleCompletionAutomation\([^)]*\)[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_COMPLETION_REACHED\]/.test(text)) {
    violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
  if (!text.includes("battleCompletionEventHandlers[event?.type]")) {
    violations.push(`${owner.replaceAll("\\", "/")} must reject null events through the completion entry`);
  }
  if (fs.existsSync(path.join(root, ownerTest))) {
    const testText = fs.readFileSync(path.join(root, ownerTest), "utf8");
    if (!testText.includes("rejects unknown battle completion events without side effects")) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown completion events`);
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
