import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const requiredSnippets = [
  "ALERT_MOOGLEMAIL_MULTI_SEND_INPUT_ERRORS: 'alertMoogleMailMultiSendInputErrors'",
  "ALERT_MOOGLEMAIL_MULTI_SEND_CREDITS_SHORTAGE: 'alertMoogleMailMultiSendCreditsShortage'",
  "ALERT_MOOGLEMAIL_MULTI_SEND_HATH_SHORTAGE: 'alertMoogleMailMultiSendHathShortage'",
  "moogleMailMultiSendInputErrorsAlert: {\n      main: '{errors}',\n      isekai: '{errors}',\n    }",
  "moogleMailMultiSendCreditsShortageAlert: {\n      main: 'Credits不足',\n      isekai: 'Credits不足',\n    }",
  "moogleMailMultiSendHathShortageAlert: {\n      main: 'Hath不足',\n      isekai: 'Hath不足',\n    }",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_MULTI_SEND_INPUT_ERRORS",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_MULTI_SEND_CREDITS_SHORTAGE",
  "event?.type === HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_MULTI_SEND_HATH_SHORTAGE",
  "var alert_hvut_mooglemail_multi_send_input_errors = function (errors) {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_MULTI_SEND_INPUT_ERRORS",
  "copy: 'moogleMailMultiSendInputErrorsAlert'",
  "values: { errors: errors }",
  "var alert_hvut_mooglemail_multi_send_credits_shortage = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_MULTI_SEND_CREDITS_SHORTAGE",
  "copy: 'moogleMailMultiSendCreditsShortageAlert'",
  "var alert_hvut_mooglemail_multi_send_hath_shortage = function () {",
  "type: HVUT_FEEDBACK_EVENT.ALERT_MOOGLEMAIL_MULTI_SEND_HATH_SHORTAGE",
  "copy: 'moogleMailMultiSendHathShortageAlert'",
];

for (const snippet of requiredSnippets) {
  if (!text.includes(snippet)) {
    violations.push(`${target} must route MoogleMail multi-send feedback through ${snippet}`);
  }
}

for (const [helper, expected] of [
  ["alert_hvut_mooglemail_multi_send_input_errors(errors.join('\\n'))", 2],
  ["alert_hvut_mooglemail_multi_send_credits_shortage()", 2],
  ["alert_hvut_mooglemail_multi_send_hath_shortage()", 2],
]) {
  const calls = text.split(helper).length - 1;
  if (calls !== expected) {
    violations.push(`${target} must keep exactly ${expected} ${helper} call sites`);
  }
}

for (const retired of ["alert(errors.join('\\n'))", "alert('Credits不足')", "alert('Hath不足')"]) {
  if (text.includes(retired)) {
    violations.push(`${target} must retire raw MoogleMail multi-send feedback: ${retired}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-multi-send-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-mooglemail-multi-send-feedback-boundary] OK - MoogleMail multi-send validation feedback uses typed HVUT feedback"
);
