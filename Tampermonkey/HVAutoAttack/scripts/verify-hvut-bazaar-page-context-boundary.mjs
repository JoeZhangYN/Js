import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_bazaar_page_context = function (query) {",
  "var section = source?.s;",
  "section: section,",
  "var hvut_bazaar_page_context = null;",
  "var get_hvut_bazaar_page_context = function () {",
  "hvut_bazaar_page_context = hvut_bazaar_page_context || create_hvut_bazaar_page_context();",
  "return hvut_bazaar_page_context;",
  "isItemShop: section === 'Bazaar' && ss === 'is'",
  "isShrine: section === 'Bazaar' && ss === 'ss'",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Bazaar page context boundary: ${required}`);
  }
}

const bazaarBodies = [
  ...text.matchAll(
    /if \(get_hvut_bazaar_page_context\(\)\.isItemShop\) \{[\s\S]*?\/\/ \[END (?:8|10)\] Bazaar - The Shrine/g
  ),
];

if (bazaarBodies.length !== 2) {
  violations.push(
    `${target} must expose exactly two Bazaar Item Shop/Shrine bodies behind page context, found ${bazaarBodies.length}`
  );
}

bazaarBodies.forEach((match, index) => {
  const body = match[0];
  for (const required of [
    "if (get_hvut_bazaar_page_context().isItemShop) {",
    "if (get_hvut_bazaar_page_context().isShrine) {",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Bazaar body[${index}] must consume page context: ${required}`);
    }
  }
  for (const forbidden of [
    "_query.ss === 'is'",
    "_query.ss === 'ss'",
    "_query.s === 'Bazaar' && get_hvut_bazaar_page_context().isItemShop",
    "_query.s === 'Bazaar' && get_hvut_bazaar_page_context().isShrine",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(
        `${target} Bazaar body[${index}] must not rebuild page identity from raw query: ${forbidden}`
      );
    }
  }
});

if (violations.length) {
  console.error("[verify-hvut-bazaar-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-bazaar-page-context-boundary] OK - Item Shop/Shrine page routing uses one Bazaar context"
);
