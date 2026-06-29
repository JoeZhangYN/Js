import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src", "battle");
const owner = path.normalize("src/battle/battle-flee-command.js");
const ownerTest = path.normalize("src/battle/battle-flee-command.test.js");
const snapshot = path.normalize("src/battle/snapshot.js");
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
    if (line.includes("click-then-reload")) {
      violations.push(`${where} legacy click-then-reload ActionResult is forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== snapshot &&
      !relative.endsWith(".test.js") &&
      line.includes('"1001"')
    ) {
      violations.push(`${where} flee button access belongs behind battle-flee-command`);
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
  "BattleFleeCommandEvent",
  "runBattleFleeCommand",
  "CLICK_AND_RELOAD",
  "NavigationEvent.SCHEDULE_RELOAD",
  '"1001"',
]);
requireText("src/battle/dispatch.js", [
  "BattleFleeCommandEvent.CLICK_AND_RELOAD",
  "runBattleFleeCommand",
]);
requireText("src/battle/escape/decide-flee.js", ['kind: "flee-command"']);

if (violations.length) {
  console.error("[verify-battle-flee-command-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-flee-command-boundary] OK - flee writes use one command entry");
