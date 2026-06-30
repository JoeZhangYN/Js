import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/battle/battle-spirit-toggle.js");
const ownerTest = path.normalize("src/battle/battle-spirit-toggle.test.js");
const snapshotTest = path.normalize("src/battle/snapshot.test.js");
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
      relative !== snapshotTest &&
      line.includes("#ckey_spirit")
    ) {
      violations.push(`${where} Spirit button access belongs behind battle-spirit-toggle`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      !relative.endsWith(".test.js") &&
      /\bg\(\s*["']lastSpiritToggleGlobalTurn["']/.test(line)
    ) {
      violations.push(`${where} Spirit cooldown state belongs behind battle-spirit-toggle`);
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
  "BattleSpiritToggleEvent",
  "runBattleSpiritToggleAutomation",
  "CLICK_AND_RECORD",
  "ACTIVATE_IF_INACTIVE",
  "READ_LAST_TOGGLE",
  "READ_ACTIVE",
  "DEFAULT_SPIRIT_TOGGLE_TURN",
  "normalizeSpiritToggleTurn",
]);
requireText("src/battle/snapshot.js", [
  "BattleSpiritToggleEvent.READ_ACTIVE",
  "runBattleSpiritToggleAutomation",
]);
requireText("src/battle/buff/activate-spirit.js", [
  "BattleSpiritToggleEvent.ACTIVATE_IF_INACTIVE",
  "runBattleSpiritToggleAutomation",
]);
requireText("src/battle/attack/execute-attack.js", [
  "BattleSpiritToggleEvent.CLICK_AND_RECORD",
  "runBattleSpiritToggleAutomation",
]);
requireText("src/battle/item/execute-item.js", [
  "BattleSpiritToggleEvent.CLICK_AND_RECORD",
  "runBattleSpiritToggleAutomation",
]);
requireText("src/battle/battle-decision-runtime.js", [
  "BattleSpiritToggleEvent.READ_LAST_TOGGLE",
  "runBattleSpiritToggleAutomation",
]);

if (violations.length) {
  console.error("[verify-battle-spirit-toggle-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-spirit-toggle-boundary] OK - Spirit toggle writes and reads use one entry"
);
