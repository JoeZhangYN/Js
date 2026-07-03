import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const modernMulti =
  /multi: function \(\) \{[\s\S]*?\n      \},\n    \};\n\n    if \(_mm\.credits\.init/.exec(text)?.[0] || "";
const legacyMulti =
  /_mm\.credits_multi = function \(\) \{[\s\S]*?\n    \};\n\n    const multi_div/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["modern credits multi-send", modernMulti],
  ["legacy credits multi-send", legacyMulti],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

for (const required of [
  "_mm.credits.multi.current = true;",
  "_mm.write.node.field.disabled = true;",
  "const stop = function () {",
  "_mm.credits.multi.current = false;",
  "_mm.write.node.field.disabled = false;",
  "return stop();",
  "queue.forEach((mail) => $mail.request(mail));",
]) {
  requirePart("modern credits multi-send", modernMulti, required);
}

for (const required of [
  "_mm.credits_multi.current = true;",
  "_mm.node.write_field.disabled = true;",
  "const stop = function () {",
  "_mm.credits_multi.current = false;",
  "_mm.node.write_field.disabled = false;",
  "return stop();",
  "queue.forEach((mail) => $mail.request(mail));",
]) {
  requirePart("legacy credits multi-send", legacyMulti, required);
}

for (const [label, body] of [
  ["modern credits multi-send", modernMulti],
  ["legacy credits multi-send", legacyMulti],
]) {
  for (const forbidden of [
    "queue.map((mail) => $mail.request(mail));",
    "alert(errors.join('\\n'));\n          return;",
    "alert('Credits不足');\n          return;",
    "alert('Hath不足');\n          return;",
    "alert(errors.join('\\n'));\n        return;",
    "alert('Credits不足');\n        return;",
    "alert('Hath不足');\n        return;",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} ${label} must not keep locked multi-send path: ${forbidden}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-multi-send-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mooglemail-multi-send-boundary] OK - MoogleMail multi-send releases UI locks");
