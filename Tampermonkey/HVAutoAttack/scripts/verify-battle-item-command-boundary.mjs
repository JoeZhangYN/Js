import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src", "battle");
const owner = path.normalize("src/battle/battle-item-command.js");
const ownerTest = path.normalize("src/battle/battle-item-command.test.js");
const itemSurface = path.normalize("src/battle/battle-item-surface.js");
const snapshotTest = path.normalize("src/battle/snapshot.test.js");
const selectors = path.normalize("src/dom/selectors.js");
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
      relative !== itemSurface &&
      relative !== snapshotTest &&
      !relative.endsWith(".test.js") &&
      line.includes("#ikey_p")
    ) {
      violations.push(`${where} gem button access belongs behind battle-item-command`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== selectors &&
      !relative.endsWith(".test.js") &&
      /\bitemSelector\(/.test(line)
    ) {
      violations.push(`${where} item button selector usage belongs behind battle-item-command`);
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
  "BattleItemCommandEvent",
  "runBattleItemCommand",
  "battleItemCommandEventHandlers",
  "CLICK_GEM",
  "CLICK_ITEM",
  "#ikey_p",
  "itemSelector",
  "runBattleCommandEvidence",
  "gemMissing",
  "itemMissing",
  "unknownItemCommand",
  "event?.type",
]);
const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}
requireText(ownerTest, ["records missing item command events as not acted"]);
requireText("src/battle/battle-action-effect-dispatch.js", [
  "BattleItemCommandEvent.CLICK_ITEM",
  "runBattleItemCommand",
]);
requireText("src/battle/item/execute-item.js", [
  "BattleItemCommandEvent.CLICK_GEM",
  "BattleItemCommandEvent.CLICK_ITEM",
  "runBattleItemCommand",
]);
requireText("src/battle/buff/decide-buff.js", ['kind: "item-command"', "itemId"]);
requireText("src/battle/buff/decide-infusion.js", ['kind: "item-command"', "itemId"]);

if (violations.length) {
  console.error("[verify-battle-item-command-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-item-command-boundary] OK - item button writes use one command entry");
