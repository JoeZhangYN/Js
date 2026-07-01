import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src", "battle");
const owner = path.normalize("src/battle/battle-skill-command.js");
const ownerTest = path.normalize("src/battle/battle-skill-command.test.js");
const readFailureTest = path.normalize("src/battle/battle-skill-command-read-failure.test.js");
const query = path.normalize("src/dom/query.js");
const targetCommand = path.normalize("src/battle/battle-target-command.js");
const targetCommandTest = path.normalize("src/battle/battle-target-command.test.js");
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
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== query &&
      relative !== targetCommand &&
      relative !== targetCommandTest &&
      !relative.endsWith(".test.js") &&
      /\bisOn\(\s*(?:plan\.)?skillId\b/.test(line)
    ) {
      violations.push(`${where} skill readiness click checks belong behind battle-skill-command`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      !relative.endsWith(".test.js") &&
      /\bgE\(\s*(?:plan\.)?skillId\b/.test(line)
    ) {
      violations.push(`${where} skill button access belongs behind battle-skill-command`);
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
  "BattleSkillCommandEvent",
  "runBattleSkillCommand",
  "battleSkillCommandEventHandlers",
  "CLICK_READY",
  "isOn",
  "clickBattleCommandElement",
  "clickResult.reason",
  "clickResult.error",
  "afterClickError",
  "recordBattleCommandResult",
  "skillNotReady",
  "skillReadinessReadFailed",
  "skillElementReadFailed",
  "readSkillReadiness",
  "readSkillElement",
  "skillElementMissing",
  "unknownSkillCommand",
  "event?.type ?? null",
]);
const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}
requireText(ownerTest, [
  "records skill click failures as not acted",
  "keeps clicked skills acted when the after-click hook fails",
  "afterClickError",
  "clickFailed",
  "records missing skill command events as not acted",
  "eventType: null",
]);
requireText(readFailureTest, [
  "records skill readiness read failures as not acted",
  "records skill element read failures as not acted",
  "skillReadinessReadFailed",
  "skillElementReadFailed",
]);
requireText("src/battle/battle-target-command.js", [
  "BattleSkillCommandEvent.CLICK_READY",
  "runBattleSkillCommand",
]);
requireText("src/battle/buff/execute-channel.js", [
  "BattleSkillCommandEvent.CLICK_READY",
  "runBattleSkillCommand",
]);
requireText("src/battle/battle-action-effect-execution.js", [
  "BattleSkillCommandEvent.CLICK_READY",
  "runBattleSkillCommand",
]);
requireText("src/battle/buff/decide-buff.js", ['kind: "skill-command"', "skillId"]);

if (violations.length) {
  console.error("[verify-battle-skill-command-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-skill-command-boundary] OK - skill button writes use one command entry"
);
