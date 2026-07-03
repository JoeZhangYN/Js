import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const buyBody = text.match(/buy: async function \(items\) \{[\s\S]*?\n  \},\n\};/)?.[0] || "";
const loadBody = text.match(/load: async function \(\) \{[\s\S]*?\n  \},\n  once:/)?.[0] || "";
const onceBody = text.match(/once: async function \(\) \{[\s\S]*?\n  \},\n  load_shop:/)?.[0] || "";
const loadShopBody = text.match(/load_shop: async function \(\) \{[\s\S]*?\n  \},\n  count:/)?.[0] || "";
const loadItemsBody =
  text.match(/battle\.load_items = async function \(\) \{[\s\S]*?\n  \};\n\};/)?.[0] || "";

if (!buyBody) violations.push(`${target} must own $item.buy entry`);
if (!loadBody) violations.push(`${target} must own $item.load entry`);
if (!onceBody) violations.push(`${target} must own $item.once entry`);
if (!loadShopBody) violations.push(`${target} must own $item.load_shop entry`);
if (!loadItemsBody) violations.push(`${target} must own battle.load_items entry`);

for (const required of [
  "var record_hvut_item_shop_parse_failure = function (stage, detail) {",
  "sessionStorage.setItem('HVAA:lastHvutItemShopParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_item_shop_row = function (row, pattern, stage) {",
  "return record_hvut_item_shop_parse_failure(stage, { name: name, onclick: onclick, text: row?.textContent || '' });",
  "var parse_hvut_inventory_item_row = function (row, stage) {",
  "return record_hvut_item_shop_parse_failure(stage, { name: name, id: idText, stock: stockText",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must own item shop parse failure boundary with ${required}`);
  }
}

for (const required of [
  "let parseFailed = false;",
  "const item = parse_hvut_inventory_item_row(tr, 'inventoryItemRow');",
  "parseFailed = true;",
  "list[item.name] = { id: item.id, stock: item.stock };",
  "if (parseFailed) return false;",
  "$item.list = list;",
  "return true;",
]) {
  if (!loadBody.includes(required)) {
    violations.push(`${target} $item.load must fail closed with ${required}`);
  }
}

for (const required of [
  "return true;",
  "return await $item.load();",
]) {
  if (!onceBody.includes(required)) {
    violations.push(`${target} $item.once must preserve inventory load result with ${required}`);
  }
}

for (const required of [
  "$item.storetoken = $id('shopform', doc)?.elements?.storetoken?.value;",
  "return record_hvut_item_shop_parse_failure('shopToken', {});",
  "let parseFailed = false;",
  "const item = parse_hvut_item_shop_row(tr, reg_item, 'inventoryShopRow');",
  "parseFailed = true;",
  "const item = parse_hvut_item_shop_row(tr, reg_shop, 'systemShopRow');",
  "if (parseFailed) return false;",
  "return true;",
]) {
  if (!loadShopBody.includes(required)) {
    violations.push(`${target} $item.load_shop must fail closed with ${required}`);
  }
}

for (const required of [
  "return false",
  "try {\n      if ((await $item.load_shop()) === false) {",
  "catch (error) {\n      record_hvut_item_shop_parse_failure('shopLoadRequest'",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n      return false;",
  "try {\n      results = await Promise.all(requests);",
  "catch (error) {\n      record_hvut_item_shop_parse_failure('shopBuyRequest'",
  "if (!results.every((r) => r))",
  "record_hvut_item_shop_parse_failure('shopBuyRejected'",
  "return true",
]) {
  if (!buyBody.includes(required)) {
    violations.push(`${target} $item.buy must classify purchase failure with ${required}`);
  }
}

for (const required of [
  "if ((await $item.load()) === false) {",
  "battle.render_supply_grid();",
  "if (!ctx.config.set('items', $item.count())) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "return true;",
]) {
  if (!loadItemsBody.includes(required)) {
    violations.push(`${target} battle.load_items must fail closed on inventory cache writes with ${required}`);
  }
}
if (/battle\.render_supply_grid\(\);\n\s*ctx\.config\.set\('items', \$item\.count\(\)\);/.test(loadItemsBody)) {
  violations.push(`${target} battle.load_items must not ignore inventory cache write failure`);
}
if (/await \$item\.load\(\);\n\s*battle\.render_supply_grid/.test(loadItemsBody)) {
  violations.push(`${target} battle.load_items must not ignore inventory parse failure`);
}

for (const forbidden of [
  "await $item.buy(items);\n    battle.load_items()",
  "await $item.buy(buy_items);\n    }\n\n    battle.load_repair",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not ignore $item.buy result before refreshing UI`);
  }
}

for (const required of [
  "if ((await $item.buy(items)) === false) return;",
  "if ((await $item.buy(buy_items)) === false)",
  "const result = await $item.buy(items);\n      if (!result) {",
  "try {\n        if ((await $item.load_shop()) === false) {",
  "catch (_error) {\n        alert('发生了一个错误.');\n        return;",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} item-buy consumers must preserve failure stop with ${required}`);
  }
}

for (const forbidden of [
  "const id = parseInt(exec[1]);",
  "const stock = parseInt(exec[2]);",
  "const sell_price = parseInt(exec[3]);",
  "const shop_stock = parseInt(exec[2]);",
  "const shop_price = parseInt(exec[3]);",
  "const id = parseInt(tr.cells[0].firstElementChild.id.slice(5));",
  "const name = tr.cells[0].textContent;",
  "const stock = parseInt(tr.cells[1].textContent);",
]) {
  if (loadShopBody.includes(forbidden) || loadBody.includes(forbidden)) {
    violations.push(`${target} must not keep unsafe item shop path: ${forbidden}`);
  }
}

for (const forbidden of [
  "await $item.load_shop();\n    } catch",
  "await $item.load_shop();\n      } catch",
  "await $item.once();",
  "catch (_error) {\n      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n      return false;",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked item shop load path: ${forbidden}`);
  }
}
if (/(^|\n)\s*await \$item\.load\(\);/.test(text)) {
  violations.push(`${target} must not keep unchecked item inventory load path: await $item.load();`);
}

if (violations.length) {
  console.error("[verify-hvut-item-buy-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-item-buy-boundary] OK - HVUT item shop buy failures fail closed");
