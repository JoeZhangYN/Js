import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "src/i18n/hv-utils.js");
const text = fs.readFileSync(target, "utf8");
const violations = [];

const classifierBody =
  text.match(/var is_hvut_isekai_equip_page = function \(pathname\) \{[\s\S]*?\n  \};/)?.[0] || "";

if (!classifierBody) {
  violations.push(
    "hv-utils must classify the Isekai equip page through is_hvut_isekai_equip_page(pathname)"
  );
}

for (const required of [
  "var is_hvut_isekai_equip_page = function (pathname) {",
  "return /\\/isekai\\/equip(\\/|$)/.test(pathname || '');",
]) {
  if (!classifierBody.includes(required)) {
    violations.push(`is_hvut_isekai_equip_page(pathname) must include ${required}`);
  }
}

if (!text.includes("if (!is_hvut_isekai_equip_page(window.location.pathname)) {")) {
  violations.push("hv-utils embed guard must consume the named Isekai equip page classifier");
}

const withoutClassifier = text.replace(classifierBody, "");
if (/\/\\\/isekai\\\/equip\(\\\/\|\$\)\//.test(withoutClassifier)) {
  violations.push("raw Isekai equip pathname regex must stay inside the classifier");
}
if (/!\s*\/\\\/isekai\\\/equip\(\\\/\|\$\)\/\.test\(window\.location\.pathname\)/.test(text)) {
  violations.push("hv-utils embed guard must not inline the Isekai equip pathname regex");
}

if (violations.length) {
  console.error("[verify-hvut-equip-page-gate-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-equip-page-gate-boundary] OK - HVUT Isekai equip page gate uses one classifier"
);
