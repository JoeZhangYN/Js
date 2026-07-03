import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const editBody = text.match(/price\.edit = function \(i, filter, callback\) \{[\s\S]*?\n  \};\n  price\.value/)?.[0] || "";
const resetBody = text.match(/price\.reset = function \(\) \{[\s\S]*?\n  \};\n  price\.items/)?.[0] || "";
const setBody = text.match(/price\.set = function \(json, replace\) \{[\s\S]*?\n  \};\n  price\.edit/)?.[0] || "";
const parseBody = text.match(/price\.parse_market = function \(filter, doc = document\) \{[\s\S]*?\n  \};\n  price\.update_market/)?.[0] || "";
const updateBody =
  text.match(/price\.update_market = async function \(filter, key, save\) \{[\s\S]*?\n  \};\n  price\.get_market/)?.[0] ||
  "";
const modernMarketBody = text.match(/_mk\.table_init = function \(\) \{[\s\S]*?\n  \};\n\n  _mk\.price_update/)?.[0] || "";
const legacyMarketBody = text.match(/_mk\.init_list = function \(\) \{[\s\S]*?\n  \};\n\n  _mk\.edit/)?.[0] || "";

if (!editBody) violations.push(`${target} must own price.edit entry`);
if (!resetBody) violations.push(`${target} must own price.reset entry`);
if (!setBody) violations.push(`${target} must own price.set entry`);
if (!parseBody) violations.push(`${target} must own price.parse_market entry`);
if (!updateBody) violations.push(`${target} must own price.update_market entry`);
if (!modernMarketBody) violations.push(`${target} must own modern market table init entry`);
if (!legacyMarketBody) violations.push(`${target} must own legacy market list init entry`);

for (const [label, body] of [
  ["price.reset", resetBody],
  ["price.set", setBody],
]) {
  if (body && !body.includes("return ctx.config.set('prices', price.json);")) {
    violations.push(`${target} ${label} must return config write result`);
  }
}

for (const required of [
  "const new_prices = await price.update_market(filter, key);",
  "if (!new_prices) {",
  "p.textarea.disabled = false;",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return;",
  "save(p);",
  "let saved;",
  "saved = price.reset();",
  "saved = price.set(new_prices, replace);",
  "if (!saved) {\n        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n        return false;",
]) {
  if (!editBody.includes(required)) {
    violations.push(`${target} price edit must keep market failure visible with ${required}`);
  }
}

for (const required of [
  "const table = $qs('#market_itemlist table', doc);",
  "return record_hvut_price_market_parse_failure('marketTable'",
  "const itemidMatch = /itemid=(\\d+)/.exec(tr.getAttribute('onclick') || '');",
  "return record_hvut_price_market_parse_failure('marketItemId'",
  "return true;",
]) {
  if (!parseBody.includes(required)) {
    violations.push(`${target} price parse must fail closed with ${required}`);
  }
}

for (const required of [
  "try {\n        await Promise.all(requests);",
  "catch (_error) {\n        return null;",
  "try {\n        await update(filter);",
  "if (price.parse_market(filter, doc) === false) throw new Error('price market parse failed');",
  "if (!price.set(new_prices)) return null;",
  "return new_prices",
]) {
  if (!updateBody.includes(required)) {
    violations.push(`${target} price update must classify market request failure with ${required}`);
  }
}

if (/await Promise\.all\(requests\);\n\s*price\.market_all = true;/.test(updateBody)) {
  violations.push(`${target} price update must not let bulk market request failures escape`);
}
if (/const itemid = \/itemid=\(\\d\+\)\/\.exec\(tr\.getAttribute\('onclick'\)\)\[1\];/.test(parseBody)) {
  violations.push(`${target} price parse must not keep unchecked itemid parse`);
}
if (!modernMarketBody.includes("if ($price.parse_market(_query.filter) === false) return;")) {
  violations.push(`${target} modern market init must stop after parse failure`);
}
if (!legacyMarketBody.includes("if ($price.parse_market(_query.filter) === false) return;")) {
  violations.push(`${target} legacy market init must stop after parse failure`);
}
if (/const new_prices = await price\.update_market\(filter, key\);\n\s*p\.textarea\.value/.test(editBody)) {
  violations.push(`${target} price edit must not save after failed market update`);
}
if (/price\.set\(new_prices, replace\);\n\s*}\n\s*p\.close/.test(editBody)) {
  violations.push(`${target} price edit must not close after unchecked config write`);
}

if (violations.length) {
  console.error("[verify-hvut-price-market-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-price-market-boundary] OK - HVUT price market failures fail closed");
