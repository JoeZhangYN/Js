import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src", "battle");
const owner = path.normalize("src/battle/battle-target-command.js");
const ownerTest = path.normalize("src/battle/battle-target-command.test.js");
const liveTargetTest = path.normalize("src/battle/battle-target-command-live-target.test.js");
const clickFailureTest = path.normalize("src/battle/battle-target-command-click-failure.test.js");
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
      line.includes("#mkey_")
    ) {
      violations.push(
        `${rel(file)}:${index + 1} monster target selector belongs behind battle-target-command`
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
  "BattleTargetCommandEvent",
  "runBattleTargetCommand",
  "battleTargetCommandEventHandlers",
  "CLICK_TARGET",
  "CLICK_SKILL_THEN_TARGET",
  "TRY_SKILL_THEN_TARGET",
  "#mkey_",
  "runBattleCommandEvidence",
  "clickBattleCommandElement",
  "clickResult.reason",
  "clickResult.error",
  "readLiveTarget",
  "targetMissing",
  "targetDead",
  "skillCommandRejected",
  "targetCommandRejected",
  "unknownTargetCommand",
  "event?.type ?? null",
]);
const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const clickTargetBody =
  ownerText.match(/function clickTarget\(targetId\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!clickTargetBody.includes("readLiveTarget(targetId)")) {
  violations.push(`${owner.replaceAll("\\", "/")} direct target clicks must use live-target ruling`);
}
if (/gE\(targetSelector\(targetId\)\)/.test(clickTargetBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} direct target clicks must not bypass live-target ruling`);
}
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}
requireText(ownerTest, [
  "records missing target command events as not acted",
  "eventType: null",
]);
requireText(clickFailureTest, [
  "records target click failures as not acted",
  "clickFailed",
]);
requireText(liveTargetTest, [
  "rejects direct target clicks when the target is dead",
  "targetDead",
]);
requireText("src/battle/battle-action-effect-dispatch.js", [
  "BattleTargetCommandEvent.CLICK_SKILL_THEN_TARGET",
  "runBattleTargetCommand",
]);
requireText("src/battle/attack/execute-attack.js", [
  "BattleTargetCommandEvent.CLICK_TARGET",
  "BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET",
  "runBattleTargetCommand",
]);
for (const relative of [
  "src/battle/debuff/decide-cast-all.js",
  "src/battle/debuff/decide-de-skill.js",
  "src/battle/debuff/decide-burst-control.js",
  "src/battle/debuff/decide-boss-imperil.js",
]) {
  requireText(relative, ["targetId", "skillId"]);
}

if (violations.length) {
  console.error("[verify-battle-target-command-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-target-command-boundary] OK - target clicks use one command entry");
