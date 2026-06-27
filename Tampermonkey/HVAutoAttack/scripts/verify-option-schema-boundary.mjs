import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/settings/schema.js");
const ownerTest = path.normalize("src/settings/schema.test.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const text = stripComments(fs.readFileSync(file, "utf8"));
  if (relative === owner || relative === ownerTest) return;

  if (
    /import\s*\{[^}]*\b(?:OPTION_SCHEMA|getOptionDefault|getFieldsByGroup)\b[^}]*\}\s*from\s*["'][^"']*\/?settings\/schema\.js["']/.test(
      text
    ) ||
    /import\s*\{[^}]*\b(?:OPTION_SCHEMA|getOptionDefault|getFieldsByGroup)\b[^}]*\}\s*from\s*["']\.\/schema\.js["']/.test(
      text
    )
  ) {
    violations.push(`${rel(file)} imports legacy option schema exits`);
  }
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["OptionSchemaEvent", "runOptionSchema"]) {
  if (!ownerText.includes(required))
    violations.push(`${owner.replaceAll("\\", "/")} must expose ${required}`);
}
for (const legacy of ["OPTION_SCHEMA", "getOptionDefault", "getFieldsByGroup"]) {
  if (new RegExp(`export\\s+(?:const|function)\\s+${legacy}\\b`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must keep ${legacy} private behind runOptionSchema(event)`
    );
  }
}
if (!/export const OptionSchemaEvent\s*=\s*Object\.freeze\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose OptionSchemaEvent`);
}
if (!/export function runOptionSchema\(\s*event\b/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runOptionSchema(event)`);
}

if (violations.length) {
  console.error("[verify-option-schema-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-option-schema-boundary] OK — option schema reads are behind one entry");
