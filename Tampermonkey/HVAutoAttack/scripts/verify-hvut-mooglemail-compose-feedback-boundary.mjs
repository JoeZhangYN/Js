import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const requiredSnippets = [
  "ALERT_MOOGLEMAIL_COMPOSE_REMOVE_ATTACHED_ITEMS: 'alertMoogleMailComposeRemoveAttachedItems'",
  "ALERT_MOOGLEMAIL_COMPOSE_ITEM_COUNT_SHORTAGE: 'alertMoogleMailComposeItemCountShortage'",
  "ALERT_MOOGLEMAIL_COMPOSE_RECIPIENT_MISSING: 'alertMoogleMailComposeRecipientMissing'",
  "ALERT_MOOGLEMAIL_COMPOSE_LOCKED_EQUIPMENT: 'alertMoogleMailComposeLockedEquipment'",
  "CONFIRM_MOOGLEMAIL_COMPOSE_PROTECTED_EQUIPMENT_ATTACH: 'confirmMoogleMailComposeProtectedEquipmentAttach'",
  "moogleMailComposeProtectedEquipmentAttachConfirm: {\n      main: '确定要附上受保护的装备吗？',\n      isekai: '确定要附上受保护的装备吗？',\n    }",
  "moogleMailComposeRemoveAttachedItemsAlert: {\n      main: '请移除附加的物品。',\n      isekai: '请移除附加的物品。',\n    }",
  "moogleMailComposeItemCountShortageAlert: {\n      main: '物品数量不足',\n      isekai: 'Insufficient number of items',\n    }",
  "moogleMailComposeRecipientMissingAlert: {\n      main: '没有收件人',\n      isekai: '没有收件人',\n    }",
  "moogleMailComposeLockedEquipmentAlert: {\n      main: '已上锁装备',\n      isekai: '已上锁装备',\n    }",
  "event?.type === HVUT_FEEDBACK_EVENT.CONFIRM_MOOGLEMAIL_COMPOSE_PROTECTED_EQUIPMENT_ATTACH",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_COMPOSE_REMOVE_ATTACHED_ITEMS",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_COMPOSE_ITEM_COUNT_SHORTAGE",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_COMPOSE_RECIPIENT_MISSING",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_COMPOSE_LOCKED_EQUIPMENT",
  "var confirm_hvut_mooglemail_compose_protected_equipment_attach = function () {",
  "type: HVUT_FEEDBACK_EVENT.CONFIRM_MOOGLEMAIL_COMPOSE_PROTECTED_EQUIPMENT_ATTACH",
  "copy: 'moogleMailComposeProtectedEquipmentAttachConfirm'",
  "var alert_hvut_mooglemail_compose_remove_attached_items = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_COMPOSE_REMOVE_ATTACHED_ITEMS",
  "copy: 'moogleMailComposeRemoveAttachedItemsAlert'",
  "var alert_hvut_mooglemail_compose_item_count_shortage = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_COMPOSE_ITEM_COUNT_SHORTAGE",
  "copy: 'moogleMailComposeItemCountShortageAlert'",
  "var alert_hvut_mooglemail_compose_recipient_missing = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_COMPOSE_RECIPIENT_MISSING",
  "copy: 'moogleMailComposeRecipientMissingAlert'",
  "var alert_hvut_mooglemail_compose_locked_equipment = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_COMPOSE_LOCKED_EQUIPMENT",
  "copy: 'moogleMailComposeLockedEquipmentAlert'",
];

for (const snippet of requiredSnippets) {
  if (!text.includes(snippet)) {
    violations.push(`${target} must route MoogleMail compose feedback through ${snippet}`);
  }
}

for (const [helper, expected] of [
  ["alert_hvut_mooglemail_compose_remove_attached_items", 2],
  ["alert_hvut_mooglemail_compose_item_count_shortage", 2],
  ["alert_hvut_mooglemail_compose_recipient_missing", 2],
  ["alert_hvut_mooglemail_compose_locked_equipment", 1],
  ["confirm_hvut_mooglemail_compose_protected_equipment_attach", 1],
]) {
  const calls = [...text.matchAll(new RegExp(`\\b${helper}\\(\\)`, "g"))].length;
  if (calls !== expected) {
    violations.push(`${target} must keep exactly ${expected} ${helper} call sites`);
  }
}

for (const retired of [
  "alert('请移除附加的物品。')",
  "alert('Insufficient number of items')",
  "alert('物品数量不足')",
  "alert('没有收件人')",
  "alert('已上锁装备')",
  "confirm('确定要附上受保护的装备吗？')",
]) {
  if (text.includes(retired)) {
    violations.push(`${target} must retire raw MoogleMail compose feedback: ${retired}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-compose-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-mooglemail-compose-feedback-boundary] OK - MoogleMail compose validation feedback uses typed HVUT feedback"
);
