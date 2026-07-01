import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src", "battle");
const owner = path.normalize("src/battle/battle-focus-command.js");
const ownerTest = path.normalize("src/battle/battle-focus-command.test.js");
const readFailureTest = path.normalize("src/battle/battle-focus-command-read-failure.test.js");
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
      line.includes("#ckey_focus")
    ) {
      violations.push(
        `${rel(file)}:${index + 1} Focus button access belongs behind battle-focus-command`
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
  "BattleFocusCommandEvent",
  "runBattleFocusCommand",
  "battleFocusCommandEventHandlers",
  "recordBattleCommandResult",
  "clickBattleCommandElement",
  "CLICK",
  "#ckey_focus",
  "readFocusElement",
  "focusElementReadFailed",
  "focus.click",
  "clickResult.reason",
  "clickResult.error",
  "unknownFocusCommand",
  "event?.type ?? null",
]);
const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}
if (!ownerText.includes("battleFocusCommandEventHandlers[event?.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} must reject null Focus events as not acted`);
}
requireText("src/battle/attack/execute-attack.js", [
  "BattleFocusCommandEvent.CLICK",
  "runBattleFocusCommand",
]);
requireText("src/battle/item/execute-item.js", [
  "BattleFocusCommandEvent.CLICK",
  "runBattleFocusCommand",
]);
requireText(ownerTest, [
  "records Focus click failures as not acted",
  "clickFailed",
  "records unknown Focus events as not acted",
  "records null Focus events as not acted",
  "unknownFocusCommand",
  "eventType: null",
]);
requireText(readFailureTest, [
  "records Focus button read failures as not acted",
  "focusElementReadFailed",
  "focus read exploded",
]);

if (violations.length) {
  console.error("[verify-battle-focus-command-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-focus-command-boundary] OK - Focus writes use one command entry");
