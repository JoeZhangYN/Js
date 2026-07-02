import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const buyBody = text.match(/buy: async function \(items\) \{[\s\S]*?\n  \},\n\};/)?.[0] || "";
const loadItemsBody =
  text.match(/battle\.load_items = async function \(\) \{[\s\S]*?\n  \};\n\};/)?.[0] || "";

if (!buyBody) violations.push(`${target} must own $item.buy entry`);
if (!loadItemsBody) violations.push(`${target} must own battle.load_items entry`);

for (const required of [
  "return false",
  "try {\n      await $item.load_shop();",
  "catch (_error) {\n      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n      return false;",
  "try {\n      results = await Promise.all(requests);",
  "catch (_error) {\n      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n      return false;",
  "if (!results.every((r) => r))",
  "return true",
]) {
  if (!buyBody.includes(required)) {
    violations.push(`${target} $item.buy must classify purchase failure with ${required}`);
  }
}

for (const required of [
  "await $item.load();",
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
  "try {\n        await $item.load_shop();",
  "catch (_error) {\n        alert('发生了一个错误.');\n        return;",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} item-buy consumers must preserve failure stop with ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-item-buy-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-item-buy-boundary] OK - HVUT item shop buy failures fail closed");
