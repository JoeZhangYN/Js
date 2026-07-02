import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const sendMatch = /\$mail\.log\('\\n========== Sending =========='\);[\s\S]*?\n  \},\n  chunk: function/.exec(text);

if (!sendMatch) {
  violations.push(`${target} must keep the MoogleMail send entry visible`);
} else {
  const body = sendMatch[0];
  const attachMatch = /if \(attach\?\.length\) \{[\s\S]*?\n    \}\n\n    if \(cod && !cod_persistent\)/.exec(body);
  if (!attachMatch) {
    violations.push(`${target} must keep the MoogleMail attach stage visible`);
  }
  const attachBody = attachMatch?.[0] || "";
  for (const required of [
    "let results;",
    "try {\n        results = await Promise.all(requests);",
    "catch (_error) {\n        $mail.log(`#${index}: !!! Error: Attachment request failed`);",
    "await $mail.discard();",
    "catch (_discardError) {\n          $mail.log(`#${index}: !!! Error: Unable to discard attachments`);",
    "return false;",
    "if (!results.every((r) => r)) {",
  ]) {
    if (!attachBody.includes(required)) {
      violations.push(`${target} mail attach must guard failure with ${required}`);
    }
  }
  if (/const results = await Promise\.all\(requests\);\n\s*if \(!results\.every/.test(attachBody)) {
    violations.push(`${target} mail attach must not continue after unchecked Promise.all`);
  }
  if (/\$mail\.discard\(\);\n\s*return;/.test(attachBody)) {
    violations.push(`${target} mail attach must await discard and return false`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-mail-attach-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mail-attach-boundary] OK - MoogleMail attach failures fail closed");
