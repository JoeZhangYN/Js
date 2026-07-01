import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/battle-pause-controls.js");
const ownerTest = path.normalize("src/battle/battle-pause-controls.test.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function requireText(relative, required) {
  const text = read(relative);
  for (const token of required) {
    if (!text.includes(token)) {
      violations.push(`${relative.replaceAll("\\", "/")} must use ${token}`);
    }
  }
  return text;
}

const ownerText = requireText(owner, [
  "BattlePauseControlsEvent",
  "battlePauseControlsEventHandlers",
  "runBattlePauseControlsAutomation",
  "PAUSE_BUTTON_OPTION_KEY",
  "PAUSE_HOTKEY_OPTION_KEY",
  "PAUSE_HOTKEY_KEY_OPTION_KEY",
  "DEFAULT_PAUSE_HOTKEY_KEY",
  "OptionEvent.READ_FIELD",
  "BattlePauseEvent.TOGGLE",
  "runBattleTurnAutomation",
]);
requireText(ownerTest, [
  "pauseButton",
  "pauseHotkey",
  "pauseHotkeyKey",
  "rejects unknown events without touching pause controls",
  "rejects null events without touching pause controls",
]);

if (
  /\bexport\s+(?:function|const)\s+(?!BattlePauseControlsEvent\b|runBattlePauseControlsAutomation\b)/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} may export only its event entry`);
}
const entryBody =
  ownerText.match(/export function runBattlePauseControlsAutomation\([^)]*\) \{[\s\S]*?\n\}/)
    ?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_INSTALL\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (!ownerText.includes("battlePauseControlsEventHandlers[event?.type]")) {
  violations.push(`${owner.replaceAll("\\", "/")} must reject null events without pause-control side effects`);
}
for (const [constant, key] of [
  ["PAUSE_BUTTON_OPTION_KEY", "pauseButton"],
  ["PAUSE_HOTKEY_OPTION_KEY", "pauseHotkey"],
  ["PAUSE_HOTKEY_KEY_OPTION_KEY", "pauseHotkeyKey"],
]) {
  if (!new RegExp(`const\\s+${constant}\\s*=\\s*"${key}"`).test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} must define ${constant}`);
  }
}
if (!/const\s+DEFAULT_PAUSE_HOTKEY_KEY\s*=\s*"p"/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must define default pause hotkey`);
}
for (const direct of [
  /readOptionField\(["']pauseButton["']/,
  /readOptionField\(["']pauseHotkey["']/,
  /readOptionField\(["']pauseHotkeyKey["']/,
]) {
  if (direct.test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} must use pause option key constants`);
  }
}

if (violations.length) {
  console.error("[verify-battle-pause-controls-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-pause-controls-contract] OK - pause control option keys are locked");
