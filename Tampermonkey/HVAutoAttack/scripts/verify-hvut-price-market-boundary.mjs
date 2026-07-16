import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const editBody =
  text.match(
    /price\.edit = function \(i, filter, callback\) \{[\s\S]*?\n  \};\n  price\.value/
  )?.[0] || "";
const resetBody =
  text.match(/price\.reset = function \(\) \{[\s\S]*?\n  \};\n  price\.items/)?.[0] || "";
const setBody =
  text.match(/price\.set = function \(json, replace\) \{[\s\S]*?\n  \};\n  price\.edit/)?.[0] || "";
const parseBody =
  text.match(
    /price\.parse_market = function \(filter, doc = document\) \{[\s\S]*?\n  \};\n  price\.update_market/
  )?.[0] || "";
const updateBody =
  text.match(
    /price\.update_market = async function \(filter, key, save\) \{[\s\S]*?\n  \};\n  price\.get_market/
  )?.[0] || "";
const modernMarketBody =
  text.match(/_mk\.table_init = function \(\) \{[\s\S]*?\n  \};\n\n  _mk\.price_update/)?.[0] || "";
const legacyMarketBody =
  text.match(/_mk\.init_list = function \(\) \{[\s\S]*?\n  \};\n\n  _mk\.edit/)?.[0] || "";
const modernClickBody =
  text.match(
    /_mk\.click_linkify = function \(\) \{[\s\S]*?\n  \};\n\n  _mk\.add_crystalpack/
  )?.[0] || "";
const legacyClickBody =
  text.match(/_mk\.click2link = function \(\) \{[\s\S]*?\n  \};\n\n  GM_addStyle/)?.[0] || "";

if (!editBody) violations.push(`${target} must own price.edit entry`);
if (!resetBody) violations.push(`${target} must own price.reset entry`);
if (!setBody) violations.push(`${target} must own price.set entry`);
if (!parseBody) violations.push(`${target} must own price.parse_market entry`);
if (!updateBody) violations.push(`${target} must own price.update_market entry`);
if (!modernMarketBody) violations.push(`${target} must own modern market table init entry`);
if (!legacyMarketBody) violations.push(`${target} must own legacy market list init entry`);
if (!modernClickBody) violations.push(`${target} must own modern market click linkify entry`);
if (!legacyClickBody) violations.push(`${target} must own legacy market click linkify entry`);

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
  "show_hvut_generic_error();",
  "return;",
  "save(p);",
  "let saved;",
  "saved = price.reset();",
  "saved = price.set(new_prices, replace);",
  "if (!saved) {\n        show_hvut_generic_error();\n        return false;",
]) {
  if (!editBody.includes(required)) {
    violations.push(`${target} price edit must keep market failure visible with ${required}`);
  }
}

for (const required of [
  "const table = $qs('#market_itemlist table', doc);",
  "return record_hvut_price_market_parse_failure('marketTable'",
  "const item = parse_hvut_price_market_row(tr, filter, 'marketItemRow');",
  "if (item === false) return false;",
  "const { name, itemid, stock, bid, ask, market_stock } = item;",
  "return true;",
]) {
  if (!parseBody.includes(required)) {
    violations.push(`${target} price parse must fail closed with ${required}`);
  }
}

for (const required of [
  "var parse_hvut_price_market_click_href = function (onclick, stage) {",
  "var match = /document\\.location='([^']+)'/.exec(onclick || '');",
  "return match ? match[1] : record_hvut_price_market_parse_failure(stage, { onclick: onclick || '' });",
  "var parse_hvut_price_market_row = function (row, filter, stage) {",
  "var identity = read_hvut_dom_identity(cells[0], HVUT_ITEM_IDENTITY_GROUPS);",
  "return record_hvut_price_market_parse_failure(stage, { filter: filter || '', name: name, observedName: identity.observed, text: row?.textContent || '' });",
  "return record_hvut_price_market_parse_failure(stage, { filter: filter || '', name: name, stock: cells[1].textContent || '' });",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must own price market click href parser with ${required}`);
  }
}

for (const required of [
  "try {\n        await run_hvut_async_task_layout('PARALLEL', filters, update);",
  "catch (error) {\n        record_hvut_price_market_parse_failure('marketBulkUpdateRequest'",
  "record_hvut_price_market_parse_failure('marketUpdateRequest'",
  "try {\n        await update(filter);",
  "if (price.parse_market(filter, doc) === false) throw new Error('price market parse failed');",
  "record_hvut_price_market_parse_failure('marketPriceSet'",
  "return new_prices",
]) {
  if (!updateBody.includes(required)) {
    violations.push(`${target} price update must classify market request failure with ${required}`);
  }
}

if (/Promise\.all\s*\(/.test(updateBody)) {
  violations.push(`${target} price update must converge through typed parallel task layout`);
}
if (/catch \(_error\) \{\n\s*return null;/.test(updateBody)) {
  violations.push(`${target} price update must not keep untyped request failure`);
}
if (/if \(!price\.set\(new_prices\)\) return null;/.test(updateBody)) {
  violations.push(`${target} price update must not keep untyped price persistence failure`);
}
if (
  /const itemid = \/itemid=\(\\d\+\)\/\.exec\(tr\.getAttribute\('onclick'\)\)\[1\];/.test(parseBody)
) {
  violations.push(`${target} price parse must not keep unchecked itemid parse`);
}
for (const forbidden of [
  "const name = tr.cells[0].textContent;",
  "const itemidMatch = /itemid=(\\d+)/.exec(tr.getAttribute('onclick') || '');",
  "const stock = parseInt(tr.cells[1].textContent);",
  "const bid = parseFloat(tr.cells[2].textContent.slice(0, -2)) || 0;",
  "const ask = parseFloat(tr.cells[3].textContent.slice(0, -2)) || 0;",
  "const market_stock = parseInt(tr.cells[4].textContent.slice(0, -2)) || 0;",
]) {
  if (parseBody.includes(forbidden)) {
    violations.push(`${target} price parse must not keep raw market row path: ${forbidden}`);
  }
}
for (const [label, body, stage] of [
  ["modern market click linkify", modernClickBody, "marketClickHref"],
  ["legacy market click linkify", legacyClickBody, "legacyMarketClickHref"],
]) {
  if (!body.includes(`const href = parse_hvut_price_market_click_href(onclick, '${stage}');`)) {
    violations.push(`${target} ${label} must parse href through price market parser`);
  }
  if (!body.includes("if (href === false) {\n        return;\n      }")) {
    violations.push(`${target} ${label} must skip malformed onclick href`);
  }
}
if (/\/document\\\.location='\(\[\^'\]\+\)'\/\.exec\(onclick\)\[1\]/.test(text)) {
  violations.push(`${target} must not keep unchecked market onclick href parse`);
}
if (!modernMarketBody.includes("if ($price.parse_market(marketPage.filter) === false) return;")) {
  violations.push(`${target} modern market init must stop after parse failure`);
}
if (!legacyMarketBody.includes("if ($price.parse_market(marketPage.filter) === false) return;")) {
  violations.push(`${target} legacy market init must stop after parse failure`);
}
for (const [label, body] of [
  ["modern market table", modernMarketBody],
  ["legacy market table", legacyMarketBody],
]) {
  if (!body.includes("read_hvut_dom_identity(tr.cells[0], HVUT_ITEM_IDENTITY_GROUPS).canonical")) {
    violations.push(`${target} ${label} must resolve the canonical item identity`);
  }
}
if (
  /const new_prices = await price\.update_market\(filter, key\);\n\s*p\.textarea\.value/.test(
    editBody
  )
) {
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
