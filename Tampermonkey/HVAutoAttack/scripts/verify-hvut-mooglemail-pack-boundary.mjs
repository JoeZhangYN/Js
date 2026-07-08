import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const modernPack =
  /pack: function \(e\) \{[\s\S]*?\n      \},\n      log: function/.exec(text)?.[0] || "";
const legacyPack =
  /_mm\.write_pack = function \(e\) \{[\s\S]*?\n    \};\n\n    _mm\.write_log/.exec(text)?.[0] ||
  "";

for (const [label, body] of [
  ["modern write pack", modernPack],
  ["legacy write pack", legacyPack],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

for (const required of [
  "_mm.write.pack.current = true;",
  "_mm.write.node.field.disabled = true;",
  "const stop = function () {",
  "_mm.write.pack.current = false;",
  "_mm.write.node.field.disabled = false;",
  "$mail.request(mail).finally(stop);",
]) {
  requirePart("modern write pack", modernPack, required);
}

for (const required of [
  "_mm.write_pack.current = true;",
  "_mm.node.write_field.disabled = true;",
  "const stop = function () {",
  "_mm.write_pack.current = false;",
  "_mm.node.write_field.disabled = false;",
  "$mail.request(mail).finally(stop);",
]) {
  requirePart("legacy write pack", legacyPack, required);
}

for (const [label, body] of [
  ["modern write pack", modernPack],
  ["legacy write pack", legacyPack],
]) {
  for (const forbidden of ["$mail.request(mail);\n      },", "$mail.request(mail);\n    };"]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} ${label} must not keep locked pack path: ${forbidden}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-hvut-mooglemail-pack-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mooglemail-pack-boundary] OK - MoogleMail single-send releases UI locks");
