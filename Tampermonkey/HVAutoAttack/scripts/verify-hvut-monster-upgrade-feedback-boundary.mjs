import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const requiredSnippets = [
  "CONFIRM_MONSTER_UPGRADE: 'confirmMonsterUpgrade'",
  "ALERT_MONSTER_UPGRADE_STOCK_SHORTAGE: 'alertMonsterUpgradeStockShortage'",
  "monsterUpgradeConfirm: { main: '确定要升级选中的怪物吗?', isekai: '确定要升级所选的怪物吗？' }",
  "monsterUpgradeStockShortageAlert: {\n      main: '水晶或混沌令牌不足',\n      isekai: '水晶或混沌令牌不足',\n    }",
  "event?.type === HVUT_FEEDBACK_EVENT.CONFIRM_MONSTER_UPGRADE",
  "return confirm(format_hvut_feedback_copy(event.copy, event.values));",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MONSTER_UPGRADE_STOCK_SHORTAGE",
  "alert(format_hvut_feedback_copy(event.copy, event.values));",
  "var confirm_hvut_monster_upgrade = function () {",
  "type: HVUT_FEEDBACK_EVENT.CONFIRM_MONSTER_UPGRADE",
  "copy: 'monsterUpgradeConfirm'",
  "var alert_hvut_monster_upgrade_stock_shortage = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MONSTER_UPGRADE_STOCK_SHORTAGE",
  "copy: 'monsterUpgradeStockShortageAlert'",
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

const alertHelperCalls = [...text.matchAll(/\balert_hvut_monster_upgrade_stock_shortage\(\)/g)]
  .length;
if (alertHelperCalls !== 2) {
  violations.push(`${target} must keep exactly two Monster Lab stock-shortage alert call sites`);
}

for (const retired of [
  "confirm('确定要升级所选的怪物吗？')",
  "confirm('确定要升级选中的怪物吗?')",
  "alert('水晶或混沌令牌不足')",
]) {
  if (text.includes(retired)) {
    violations.push(`${target} must retire raw Monster Lab upgrade feedback: ${retired}`);
  }
}

const rawConfirmSideEffects = [...text.matchAll(/\bconfirm\s*\(/g)].filter((match) => {
  const before = text.slice(Math.max(0, match.index - 80), match.index);
  const after = text.slice(match.index, match.index + 120);
  return (
    after.includes("format_hvut_feedback_copy(event.copy, event.values)") ||
    before.includes("function confirm_event")
  );
});

if (
  !rawConfirmSideEffects.some((match) =>
    text
      .slice(match.index, match.index + 120)
      .includes("format_hvut_feedback_copy(event.copy, event.values)")
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
