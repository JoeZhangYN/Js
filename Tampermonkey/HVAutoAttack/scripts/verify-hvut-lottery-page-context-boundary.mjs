import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_lottery_page_context = function (query) {",
  "var source = resolve_hvut_page_query(query);",
  "var section = source?.s;",
  "var ss = source?.ss;",
  "section: section,",
  "ss: ss,",
  "isLottery: section === 'Bazaar' && (ss === 'lt' || ss === 'la'),",
  "hasNextDraw: !!$qs('img[src$=\"lottery_next_d.png\"]'),",
  "var hvut_lottery_page_context = null;",
  "var get_hvut_lottery_page_context = function () {",
  "hvut_lottery_page_context = hvut_lottery_page_context || create_hvut_lottery_page_context();",
  "return hvut_lottery_page_context;",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Lottery page context boundary: ${required}`);
  }
}

const lotteryBodies = [
  ...text.matchAll(/if \(get_hvut_lottery_page_context\(\)\.isLottery\) \{[\s\S]*?\n\} else\n\/\/ \[END (?:13|14)\] Bazaar - Lottery/g),
].map((match) => match[0]);

if (lotteryBodies.length !== 2) {
  violations.push(`${target} must keep both Lottery segment bodies visible, found ${lotteryBodies.length}`);
}

for (const [index, body] of lotteryBodies.entries()) {
  for (const required of [
    "const lotteryPage = get_hvut_lottery_page_context();",
    "if ($config.settings.lotteryNotification && lotteryPage.hasNextDraw) {",
    "const previous = _lt.json[lotteryPage.ss].hide;",
    "_lt.json[lotteryPage.ss].hide = !show;",
    "_lt.json[lotteryPage.ss].hide = previous;",
    "checked: !_lt.json[lotteryPage.ss].hide",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Lottery body[${index}] must consume page context: ${required}`);
    }
  }
  for (const forbidden of [
    "$qs('img[src$=\"lottery_next_d.png\"]')",
    "_lt.json[_query.ss]",
    "_query.s === 'Bazaar' && (_query.ss === 'lt' || _query.ss === 'la')",
    "_query.ss === 'lt'",
    "_query.ss === 'la'",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} Lottery body[${index}] must not rebuild page identity from raw query/DOM: ${forbidden}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-hvut-lottery-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-lottery-page-context-boundary] OK - Lottery notification page state uses one context");
