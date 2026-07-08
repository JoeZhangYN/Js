import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const requiredSnippets = [
  "CONFIRM_MOOGLEMAIL_ATTACHMENT_TAKE: 'confirmMoogleMailAttachmentTake'",
  "CONFIRM_MOOGLEMAIL_MESSAGE_RETURN: 'confirmMoogleMailMessageReturn'",
  "moogleMailAttachmentTakeConfirm: {",
  "main: '拿取附件将从你的账户中扣除 {credits} Credits.\\n确定吗?'",
  "isekai: 'Accepting the attachments will deduct {credits} Credits from your account.\\nAre you sure?'",
  "moogleMailMessageReturnConfirm: {",
  "main: '这将把消息退回给发送者.\\n确定吗?'",
  "isekai: '这会将邮件退回给发件人。\\n确定吗？'",
  "var format_hvut_feedback_copy = function (key, values) {",
  "message = message.split(`{${name}}`).join(values[name]);",
  "var confirm_hvut_mooglemail_attachment_take = function (value) {",
  "type: HVUT_FEEDBACK_EVENT.CONFIRM_MOOGLEMAIL_ATTACHMENT_TAKE",
  "values: { credits: parseInt(value).toLocaleString() }",
  "var confirm_hvut_mooglemail_message_return = function () {",
  "type: HVUT_FEEDBACK_EVENT.CONFIRM_MOOGLEMAIL_MESSAGE_RETURN",
  "return confirm(format_hvut_feedback_copy(event.copy, event.values));",
];

for (const snippet of requiredSnippets) {
  if (!text.includes(snippet)) {
    violations.push(`${target} must route MoogleMail action feedback through ${snippet}`);
  }
}

const attachmentConfirmCalls = [
  ...text.matchAll(/\bconfirm_hvut_mooglemail_attachment_take\(value\)/g),
].length;
if (attachmentConfirmCalls !== 2) {
  violations.push(
    `${target} must keep exactly two MoogleMail attachment-take confirmation call sites`
  );
}

const returnConfirmCalls = [...text.matchAll(/\bconfirm_hvut_mooglemail_message_return\(\)/g)]
  .length;
if (returnConfirmCalls !== 4) {
  violations.push(
    `${target} must keep exactly four MoogleMail return/recall confirmation call sites`
  );
}

for (const retired of [
  "confirm(`Accepting the attachments will deduct ${parseInt(value).toLocaleString()} Credits from your account.\\nAre you sure?`)",
  "confirm(`拿取附件将从你的账户中扣除 ${parseInt(value).toLocaleString()} Credits.\\n确定吗?`)",
  "confirm('这会将邮件退回给发件人。\\n确定吗？')",
  "confirm('这将把消息退回给发送者.\\n确定吗?')",
]) {
  if (text.includes(retired)) {
    violations.push(`${target} must retire raw MoogleMail action confirmation: ${retired}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-action-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-mooglemail-action-feedback-boundary] OK - MoogleMail action confirmations use typed HVUT feedback"
);
