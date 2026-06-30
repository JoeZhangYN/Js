import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/buff/execute-channel.js");
const ownerTest = path.normalize("src/battle/buff/execute-channel.test.js");
const actionEffect = path.normalize("src/battle/battle-action-effect-dispatch.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const actionEffectText = read(actionEffect);

for (const required of [
  "BattleChannelExecutionEvent",
  "APPLY_PLAN",
  "runBattleChannelExecution",
  "BattleSkillCommandEvent.CLICK_READY",
  "runBattleSkillCommand",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleChannelExecutionEvent\b|runBattleChannelExecution\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover channel execution contract`);
}

if (
  !actionEffectText.includes("BattleChannelExecutionEvent.APPLY_PLAN") ||
  !actionEffectText.includes("runBattleChannelExecution")
) {
  violations.push(`${rel(actionEffect)} must execute channel plans through the channel entry`);
}
if (/\bexecuteChannel\s*\(/.test(actionEffectText)) {
  violations.push(`${rel(actionEffect)} must not call the retired executeChannel path`);
}

for (const relative of ["src/battle", "src/core"]) {
  const dir = path.join(root, relative);
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const normalized = path.normalize(path.relative(root, file));
    if (normalized === owner || normalized === actionEffect) continue;
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*buff\/execute-channel\.js["']/.test(text)) {
      violations.push(
        `${rel(normalized)} must not bypass action effect dispatch for channel plans`
      );
    }
    if (/\bexecuteChannel\s*\(/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired executeChannel directly`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-channel-execution-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-channel-execution-boundary] OK - channel execution is behind one entry"
);
