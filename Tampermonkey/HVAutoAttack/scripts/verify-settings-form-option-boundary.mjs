import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/settings/form-option.js");
const settingsRender = path.normalize("src/settings/render.js");
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

const renderText = fs.readFileSync(path.join(root, settingsRender), "utf8");
if (!renderText.includes("SettingsFormOptionEvent.COLLECT_OPTION")) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must collect option through form-option`
  );
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
