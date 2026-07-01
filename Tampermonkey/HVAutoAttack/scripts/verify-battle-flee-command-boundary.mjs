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
  "battleFleeCommandEventHandlers",
  "BattleCommandEvidenceEvent.RECORD_RESULT",
  "runBattleCommandEvidence",
  "clickBattleCommandElement",
  "clickResult.reason",
  "clickResult.error",
  "CLICK_AND_RELOAD",
  "NavigationEvent.SCHEDULE_RELOAD",
  "scheduleFleeReload",
  "navigationResult: navigation.result",
  "navigationError",
  'source: "battleFleeCommand"',
  "command: EVENT_CLICK_AND_RELOAD",
  "flee.clickAndReload",
  "unknownFleeCommand",
  "event?.type ?? null",
  '"1001"',
]);
const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}
if (!ownerText.includes("battleFleeCommandEventHandlers[event?.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} must reject null Flee events without reload`);
}
requireText("src/battle/battle-action-effect-dispatch.js", [
  "BattleFleeCommandEvent.CLICK_AND_RELOAD",
  "runBattleFleeCommand",
]);
requireText("src/battle/escape/decide-flee.js", ['kind: "flee-command"']);
requireText(ownerTest, [
  "keeps clicked Flee acted while recording rejected reload scheduling",
  "navigationResult: false",
  "keeps clicked Flee acted when reload scheduling throws",
  "navigation blocked",
  "navigationError",
  "records Flee click failures as not acted without scheduling reload",
  "clickFailed",
  "records unknown Flee events as not acted",
  "records null Flee events as not acted without scheduling reload",
  "unknownFleeCommand",
  "eventType: null",
]);

if (violations.length) {
  console.error("[verify-battle-flee-command-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-flee-command-boundary] OK - flee writes use one command entry");
