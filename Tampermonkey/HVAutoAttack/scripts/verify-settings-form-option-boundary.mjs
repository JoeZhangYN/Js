import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/settings/form-option.js");
const settingsRender = path.normalize("src/settings/render.js");
const customizeInspect = path.normalize("src/settings/customize.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["SettingsFormOptionEvent", "runSettingsFormOptionAutomation"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
const entryBody =
  ownerText.match(/export function runSettingsFormOptionAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (!/const settingsFormOptionEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_COLLECT_OPTION\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (entryBody.includes("event.type") || !entryBody.includes("event?.type")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null form option events`);
}
const ownerTest = path.normalize("src/settings/form-option.test.js");
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover settings form option entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (
    !ownerTestText.includes("rejects invalid form option events without collecting fields") ||
    !ownerTestText.includes("runSettingsFormOptionAutomation(null)")
  ) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown and null form option events`);
  }
}

const renderText = fs.readFileSync(path.join(root, settingsRender), "utf8");
if (!renderText.includes("SettingsFormOptionEvent.COLLECT_OPTION")) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must collect option through form-option`
  );
}
if (!renderText.includes("OptionEvent.READ_FIELD")) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must hydrate settings from option fields through option entry`
  );
}
if (/\bg\(\s*["']option["']/.test(renderText)) {
  violations.push(`${settingsRender.replaceAll("\\", "/")} must not read raw option state`);
}
const customizeText = fs.readFileSync(path.join(root, customizeInspect), "utf8");
if (!customizeText.includes("export function readCustomizeInspectTarget(target)")) {
  violations.push(`${customizeInspect.replaceAll("\\", "/")} must expose one customize inspect read entry`);
}
if (!customizeText.includes("let find = readCustomizeInspectTarget(target)")) {
  violations.push(`${customizeInspect.replaceAll("\\", "/")} must route inspect mousemove through readCustomizeInspectTarget`);
}
if (/match\([^;\n]+\)\[1\]/.test(customizeText)) {
  violations.push(`${customizeInspect.replaceAll("\\", "/")} must not index raw match() results`);
}
for (const required of [
  "return match ? `Item Id: ${match[1]}` : undefined;",
  "return match ? `Equip Id: ${match[1]}` : undefined;",
  "return match ? `Buff Img: ${match[1]}` : undefined;",
]) {
  if (!customizeText.includes(required)) {
    violations.push(`${customizeInspect.replaceAll("\\", "/")} must fail closed through ${required}`);
  }
}
const customizeTest = path.normalize("src/settings/customize.test.js");
if (!fs.existsSync(path.join(root, customizeTest))) {
  violations.push(`${customizeTest.replaceAll("\\", "/")} must cover customize inspect parsing`);
} else {
  const customizeTestText = fs.readFileSync(path.join(root, customizeTest), "utf8");
  if (!customizeTestText.includes("fails closed for malformed inspect attributes")) {
    violations.push(`${customizeTest.replaceAll("\\", "/")} must cover malformed inspect attributes`);
  }
}
const applyBlock =
  /gE\(["']\.hvAAApply["'][\s\S]*?gE\(["']\.hvAACancel["']/.exec(renderText)?.[0] || "";
for (const forbidden of [
  /\bitemArray\b/,
  /\bitemValue\b/,
  /itemName\.split\(["']_["']\)/,
  /className === ["']customizeInput["']/,
  /hasAttribute\(["']data-default-on["']\)/,
]) {
  if (forbidden.test(applyBlock)) {
    violations.push(
      `${rel(path.join(root, settingsRender))} must not parse settings form fields directly`
    );
  }
}

if (violations.length) {
  console.error("[verify-settings-form-option-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-settings-form-option-boundary] OK — settings form option collection is behind one entry"
);
