import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_market_page_context = function (query) {",
  "var source = resolve_hvut_page_query(query);",
  "var section = source?.s;",
  "var ss = source?.ss;",
  "var screen = source?.screen || 'browseitems';",
  "var filter = source?.filter || 'co';",
  "section: section,",
  "ss: ss,",
  "screen: screen,",
  "filter: filter,",
  "isMarket: section === 'Bazaar' && ss === 'mk',",
  "isBuyOrders: screen === 'buyorders',",
  "isSellOrders: screen === 'sellorders',",
  "isCrystalBrowse: screen === 'browseitems' && filter === 'mo',",
  "var hvut_market_page_context = null;",
  "var get_hvut_market_page_context = function () {",
  "hvut_market_page_context = hvut_market_page_context || create_hvut_market_page_context();",
  "return hvut_market_page_context;",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Market page context boundary: ${required}`);
  }
}

const marketBodies = [
  ...text.matchAll(
    /if \(get_hvut_market_page_context\(\)\.isMarket\) \{[\s\S]*?\n\} else\n\/\/ \[END (?:9|11)\] Bazaar - The Market/g
  ),
].map((match) => match[0]);

if (marketBodies.length !== 2) {
  violations.push(
    `${target} must keep both Market segment bodies visible, found ${marketBodies.length}`
  );
}

for (const [index, body] of marketBodies.entries()) {
  for (const required of [
    "const marketPage = get_hvut_market_page_context();",
    "$price.parse_market(marketPage.filter)",
    "$price.edit(_mk.items, marketPage.filter",
    "marketPage.isCrystalBrowse",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Market body[${index}] must consume page context: ${required}`);
    }
  }
  for (const forbidden of [
    "if (!_query.screen) {",
    "_query.screen = 'browseitems';",
    "if (!_query.filter) {",
    "_query.filter = 'co';",
    "$price.parse_market(_query.filter)",
    "$price.edit(_mk.items, _query.filter",
    "_query.screen === 'buyorders'",
    "_query.screen === 'sellorders'",
    "_query.s === 'Bazaar' && _query.ss === 'mk'",
    "_query.ss === 'mk'",
    "_query.screen !== 'browseitems' || _query.filter !== 'mo'",
    "_query.screen === 'browseitems' && _query.filter === 'mo'",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(
        `${target} Market body[${index}] must not rebuild page identity from raw query: ${forbidden}`
      );
    }
  }
}

if (
  !marketBodies[0]?.includes("if (marketPage.isBuyOrders)") ||
  !marketBodies[0]?.includes("if (marketPage.isSellOrders)")
) {
  violations.push(`${target} modern Market order check must use typed buy/sell order decisions`);
}

if (violations.length) {
  console.error("[verify-hvut-market-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-market-page-context-boundary] OK - Market screen/filter routing uses one page context"
);
