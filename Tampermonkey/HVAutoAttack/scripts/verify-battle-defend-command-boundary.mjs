import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src", "battle");
const owner = path.normalize("src/battle/battle-defend-command.js");
const ownerTest = path.normalize("src/battle/battle-defend-command.test.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      !relative.endsWith(".test.js") &&
      line.includes("#ckey_defend")
    ) {
      violations.push(
        `${rel(file)}:${index + 1} Defend access belongs behind battle-defend-command`
      );
    }
  });
}

function requireText(relative, required) {
  const text = fs.readFileSync(path.join(root, relative), "utf8");
  for (const token of required) {
    if (!text.includes(token)) {
      violations.push(`${relative.replaceAll("\\", "/")} must use ${token}`);
    }
  }
}

walk(srcDir);

requireText(owner, [
  "BattleDefendCommandEvent",
  "runBattleDefendCommand",
  "battleDefendCommandEventHandlers",
  "BattleCommandEvidenceEvent.RECORD_RESULT",
  "runBattleCommandEvidence",
  "clickBattleCommandElement",
  "clickResult.reason",
  "clickResult.error",
  "CLICK",
  "#ckey_defend",
  "defend.click",
  "unknownDefendCommand",
  "event?.type ?? null",
]);
const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}
if (!ownerText.includes("battleDefendCommandEventHandlers[event?.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} must reject null Defend events as not acted`);
}
if (ownerText.includes("attemptClick(")) {
  violations.push(`${owner.replaceAll("\\", "/")} must use battle command click evidence, not attemptClick`);
}
requireText("src/battle/battle-action-effect-dispatch.js", [
  "BattleDefendCommandEvent.CLICK",
  "runBattleDefendCommand",
]);
requireText("src/battle/defense/decide-defend.js", ['kind: "defend-command"']);
requireText(ownerTest, [
  "records Defend click failures as not acted",
  "clickFailed",
  "records unknown Defend events as not acted",
  "records null Defend events as not acted",
  "unknownDefendCommand",
  "eventType: null",
]);

if (violations.length) {
  console.error("[verify-battle-defend-command-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-defend-command-boundary] OK - Defend writes use one command entry");
