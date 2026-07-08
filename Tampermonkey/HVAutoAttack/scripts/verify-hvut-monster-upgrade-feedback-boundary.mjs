import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const requiredSnippets = [
  "CONFIRM_MONSTER_UPGRADE: 'confirmMonsterUpgrade'",
  "monsterUpgradeConfirm: { main: '确定要升级选中的怪物吗?', isekai: '确定要升级所选的怪物吗？' }",
  "if (event?.type === HVUT_FEEDBACK_EVENT.CONFIRM_MONSTER_UPGRADE) {\n      return confirm(resolve_hvut_feedback_copy(event.copy));\n    }",
  "var confirm_hvut_monster_upgrade = function () {",
  "type: HVUT_FEEDBACK_EVENT.CONFIRM_MONSTER_UPGRADE",
  "copy: 'monsterUpgradeConfirm'",
];

for (const snippet of requiredSnippets) {
  if (!text.includes(snippet)) {
    violations.push(`${target} must route Monster Lab upgrade confirmation through ${snippet}`);
  }
}

const helperCalls = [...text.matchAll(/\bconfirm_hvut_monster_upgrade\(\)/g)].length;
if (helperCalls !== 2) {
  violations.push(`${target} must keep exactly two Monster Lab upgrade confirmation call sites`);
}

for (const retired of [
  "confirm('确定要升级所选的怪物吗？')",
  "confirm('确定要升级选中的怪物吗?')",
]) {
  if (text.includes(retired)) {
    violations.push(`${target} must retire raw Monster Lab upgrade confirmation: ${retired}`);
  }
}

const rawConfirmSideEffects = [...text.matchAll(/\bconfirm\s*\(/g)].filter((match) => {
  const before = text.slice(Math.max(0, match.index - 80), match.index);
  const after = text.slice(match.index, match.index + 120);
  return (
    after.includes("resolve_hvut_feedback_copy(event.copy)") ||
    before.includes("function confirm_event")
  );
});

if (
  !rawConfirmSideEffects.some((match) =>
    text.slice(match.index, match.index + 120).includes("resolve_hvut_feedback_copy(event.copy)")
  )
) {
  violations.push(`${target} must keep the typed HVUT feedback confirm side effect centralized`);
}

if (violations.length) {
  console.error("[verify-hvut-monster-upgrade-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-monster-upgrade-feedback-boundary] OK - Monster Lab upgrade confirmation uses typed HVUT feedback"
);
